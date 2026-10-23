import { intakeFields } from "@/content/site";

/** Keep only known fields, trimmed and length-limited. */
export function cleanAnswers(input: unknown): Record<string, string> {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const f of intakeFields) {
    const v = src[f.id];
    if (typeof v === "string" && v.trim()) out[f.id] = v.trim().slice(0, f.maxLength);
  }
  return out;
}

const MAX_TRANSCRIPT_CHARS = 60_000;

/** Turn the browser's chat lines into readable text: "Customer: …" / "Arkko: …", oldest first. */
export function cleanTranscript(input: unknown): string | undefined {
  if (!Array.isArray(input)) return undefined;
  const text = input
    .filter((l) => l && (l.from === "customer" || l.from === "arkko") && typeof l.text === "string" && l.text.trim())
    .slice(0, 120)
    .map((l) => `${l.from === "customer" ? "Customer" : "Arkko"}: ${l.text.trim().slice(0, 4000)}`)
    .join("\n\n");
  return text ? text.slice(0, MAX_TRANSCRIPT_CHARS) : undefined;
}

export function missingRequired(answers: Record<string, string>) {
  return intakeFields.filter((f) => f.required && !answers[f.id]).map((f) => f.id);
}
