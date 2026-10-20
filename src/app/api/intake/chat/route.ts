import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";
import { fail } from "@/lib/http";
import { cleanAnswers } from "@/lib/intake";
import { CHAT_MODEL, CHAT_SYSTEM, MAX_BODY_CHARS, briefInput, chatBody, proposeBriefTool } from "@/lib/chat";

type Param = Anthropic.Beta.BetaMessageParam;

/**
 * One turn of the intake chat. Streams newline-delimited JSON:
 *   {"t":"text","v":"…"}   live reply text
 *   {"t":"done","user":…,"assistant":…,"brief":{…}?}   messages to append to the history
 *   {"t":"error","v":"…"}   the turn failed; nothing should be appended
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS) return fail(413, "This conversation is too long. Please switch to the form.");
  let parsed;
  try {
    parsed = chatBody.safeParse(JSON.parse(raw));
  } catch {
    return fail(400, "Invalid request");
  }
  if (!parsed.success) return fail(400, "Invalid request");
  const { history, message } = parsed.data;

  if (!config.chatEnabled) {
    console.error("intake chat: ANTHROPIC_API_KEY is not set");
    return fail(503, "Chat isn't available right now. Please use the form.");
  }
  const client = new Anthropic();

  // If the last turn proposed a brief and the user replied instead of confirming, answer the tool call first.
  const last = history.at(-1);
  const pending = last?.role === "assistant" ? last.content.find((b) => b.type === "tool_use") : undefined;
  const user: Param = {
    role: "user",
    content: pending
      ? [
          { type: "tool_result", tool_use_id: String(pending.id), content: "The user replied instead of confirming." },
          { type: "text", text: message },
        ]
      : message,
  };

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (e: object) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        const stream = client.beta.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 8000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          cache_control: { type: "ephemeral" },
          system: CHAT_SYSTEM,
          tools: [proposeBriefTool],
          messages: [...(history as Param[]), user],
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") send({ t: "text", v: event.delta.text });
        }
        const msg = await stream.finalMessage();
        const tool = msg.content.find((b) => b.type === "tool_use");

        if (msg.stop_reason === "refusal") {
          send({ t: "error", v: "Sorry, I can't help with that. Could you put it another way?" });
        } else if (tool && msg.stop_reason === "max_tokens") {
          send({ t: "error", v: "Something went wrong. Please send that again." });
        } else if (tool) {
          const input = briefInput.safeParse(tool.input);
          if (!input.success) send({ t: "error", v: "Something went wrong. Please send that again." });
          else send({ t: "done", user, assistant: { role: "assistant", content: msg.content }, brief: cleanAnswers(input.data) });
        } else {
          send({ t: "done", user, assistant: { role: "assistant", content: msg.content } });
        }
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
          console.error("intake chat: Anthropic credentials rejected", err.message);
          send({ t: "error", v: "Chat isn't available right now. Please use the form." });
        } else if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
          send({ t: "error", v: "We're a bit busy. Please try again in a moment." });
        } else {
          console.error("intake chat failed", err);
          send({ t: "error", v: "Something went wrong. Please send that again." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
