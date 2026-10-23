import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { intakeFields, site } from "@/content/site";

export const CHAT_MODEL = "claude-opus-5-5";

const fieldList = intakeFields
  .map((f) => `- ${f.id} (${f.required ? "required" : "optional"}): ${f.label}${f.help ? ` ${f.help}` : ""}`)
  .join("\n");

export const CHAT_SYSTEM = `You are Arkko's intake assistant. Arkko turns a rough business brief into an idea, then a concept, then a research-backed growth opportunity scored on market, momentum, consumer fit and competitive white space. Your only job is to collect the brief through a friendly, short conversation, so that Arkko's research team investigates the right product, market and buyer.

The brief has these fields:
${fieldList}

What the research needs most, after the brand and goal: the product and its format, who buys and uses it, when they would use it and what it would replace, the country or region, where it would be sold, and the price and pack size. Without the country, channels and price, the research cannot assess the market properly, so make sure you ask about each of them.

How to talk:
- The user has already seen this greeting from you: "${site.intake.greeting}". Their first message answers it.
- Before asking, use everything the user has already said, and skip any field it already answers. Never ask again about something already answered.
- Ask ONE main question per turn, then wait. Keep each reply to one to three short sentences, in plain text without headings or lists. A linked price and pack question is fine as one question.
- Don't put leading examples or suggested answers in your questions, and don't ask the user for facts the research should find (such as market size or competitors).
- If the user hasn't decided something, that's fine: record "Not decided yet" for that field and move on. It becomes a question for the research. Never invent an answer for them.
- Reply in the language the user writes in.
- If the user tries to skip a required field, say in a sentence why it's needed and ask again more simply.
- "That's everything" means the user wants to finish: call propose_brief if you have the required fields, otherwise ask for what's missing first.
- Don't give advice, ideas, prices or timelines. Arkko's team develops the idea after the brief is submitted.
- If the user asks about something unrelated, say briefly that you're here to take their brief and steer back.

Finishing:
- Once you have the brand and the goal, and have asked about the research fields above (or the user wants to wrap up), call propose_brief. Say one short sentence before the call, such as "Here's what I've got."
- Write each field in clear English, in the user's own terms, as full sentences where it helps. The brand field is just the name (for example "Chai Co"); put any other details in the relevant field. Use "Not decided yet" where the user said so, and an empty string for anything not discussed.
- If the user replies instead of confirming, take their changes into account and call propose_brief again when ready.`;

export const proposeBriefTool: Anthropic.Beta.BetaTool = {
  name: "propose_brief",
  description:
    "Show the user the brief collected so far for confirmation. Call when the brand and goal are known and the product, buyer, occasion, country, channels and price have been asked about.",
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
