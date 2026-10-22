import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { intakeFields, site } from "@/content/site";

export const CHAT_MODEL = "claude-opus-5-5";

const fieldList = intakeFields
  .map((f) => `- ${f.id} (${f.required ? "required" : "optional"}): ${f.label}${f.help ? ` ${f.help}` : ""}`)
  .join("\n");

export const CHAT_SYSTEM = `You are Arkko's intake assistant. Arkko turns a rough business brief into an idea, then a concept, then a research-backed growth opportunity. Your only job is to collect the brief through a friendly, short conversation.

The brief has these fields:
${fieldList}

How to talk:
- The user has already seen this greeting from you: "${site.intake.greeting}". Their first message answers it.
- Ask one thing at a time. Keep each reply to one to three short sentences, in plain text without headings or lists.
- Reply in the language the user writes in.
- Ask a short follow-up when an answer is vague, but don't interrogate. Optional fields can be skipped if the user has nothing to add. If the user tries to skip a required field, say in a sentence why it's needed and ask again more simply.
- "That's everything" means the user wants to finish: call propose_brief if you have the required fields, otherwise ask for what's missing first.
- Don't invent facts, and don't give advice, ideas, prices or timelines. Arkko's team develops the idea after the brief is submitted.
- If the user asks about something unrelated, say briefly that you're here to take their brief and steer back.

Finishing:
- Once you have the brand and the goal, and have asked about the optional fields (or the user wants to wrap up), call propose_brief. Say one short sentence before the call, such as "Here's what I've got."
- Write each field in clear English, in the user's own terms, as full sentences where it helps. The brand field is just the name (for example "Chai Co"); put any other details in the relevant field. Use an empty string for anything not discussed.
- If the user replies instead of confirming, take their changes into account and call propose_brief again when ready.`;

export const proposeBriefTool: Anthropic.Beta.BetaTool = {
  name: "propose_brief",
  description:
    "Show the user the brief collected so far for confirmation. Call when the brand and goal are known and the optional fields have been asked about.",
  strict: true,
  eager_input_streaming: true,
  input_schema: {
    type: "object",
    properties: Object.fromEntries(
      intakeFields.map((f) => [f.id, { type: "string", description: `${f.label} Empty string if not discussed.` }]),
    ),
    required: intakeFields.map((f) => f.id),
    additionalProperties: false,
  },
};

export const briefInput = z.object(Object.fromEntries(intakeFields.map((f) => [f.id, z.string()])));

/**
 * The client keeps the conversation and sends it back each turn, unchanged, so the model's
 * thinking blocks stay valid. User turns may only carry text or tool results; size is capped.
 */
const block = z.looseObject({ type: z.string() });
const userBlock = z.union([
  z.looseObject({ type: z.literal("text"), text: z.string().max(4000) }),
  z.looseObject({ type: z.literal("tool_result"), tool_use_id: z.string() }),
]);

export const chatBody = z.object({
  history: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("user"), content: z.union([z.string().max(4000), z.array(userBlock).max(4)]) }),
        z.object({ role: z.literal("assistant"), content: z.array(block).max(20) }),
      ]),
    )
    .max(60),
  message: z.string().trim().min(1).max(4000),
});

export const MAX_BODY_CHARS = 300_000;

/**
 * Messages one visitor (by IP) may send per hour. A brief takes about 6–10.
 * Kept in memory, so it is per server instance: a guard against runaway use, not a hard cap.
 * Set a monthly spend limit in the Claude Console for that.
 */
const RATE = { limit: 40, windowMs: 60 * 60 * 1000 };
const hits = new Map<string, number[]>();

export function allowChatMessage(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs);
  if (recent.length >= RATE.limit) return false;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return true;
}
