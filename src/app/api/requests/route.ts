import { fail, json } from "@/lib/http";
import { cleanAnswers, cleanTranscript } from "@/lib/intake";
import { insertRequest, newId, newToken, now } from "@/lib/db";

/** Create a draft request. Repeating with the same idempotencyKey returns the same draft. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key = body?.idempotencyKey;
  if (typeof key !== "string" || key.length < 16 || key.length > 100)
    return fail(400, "idempotencyKey is required");

  const at = now();
  const rec = await insertRequest({
    id: newId("req"),
    idempotencyKey: key,
    draftToken: newToken(),
    resultsToken: newToken(),
    status: "draft",
    createdAt: at,
    updatedAt: at,
    answers: cleanAnswers(body.answers),
    chatTranscript: cleanTranscript(body.chatTranscript),
    images: [],
    assets: [],
    reviews: [],
    events: [],
    handoff: [],
  });
  return json({ id: rec.id, draftToken: rec.draftToken, status: rec.status }, 201);
}
