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

export function missingRequired(answers: Record<string, string>) {
  return intakeFields.filter((f) => f.required && !answers[f.id]).map((f) => f.id);
}
