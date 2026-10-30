import { fail, json } from "@/lib/http";
import { cleanAnswers, missingRequired } from "@/lib/intake";
import { getByResultsToken, newId, now, updateRequest } from "@/lib/db";
import { handOff } from "@/lib/otto";
import { canRevise } from "@/lib/revise";
import { intakeFields } from "@/content/site";

/**
 * Edit the brief after its results are ready and research it again. The new results become the next
 * version; the edit records which answers changed and what they were.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/status/[token]/revise">) {
  const { token } = await ctx.params;
  const rec = await getByResultsToken(token);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");
  if (!canRevise(rec)) return fail(409, "This brief can no longer be edited");

  const body = await req.json().catch(() => null);
  const answers = cleanAnswers(body?.answers);
  const missing = missingRequired(answers);
  if (missing.length) return fail(400, "Some required answers are missing", { missing });

  // Set inside the update; the cast keeps TypeScript from narrowing it to the initial value.
  let outcome = "closed" as "revised" | "unchanged" | "closed";
  const updated = await updateRequest(rec.id, (r) => {
    if (!canRevise(r)) return; // lost a race with another edit
    const changed = intakeFields.map((f) => f.id).filter((id) => (answers[id] ?? "") !== (r.answers[id] ?? ""));
    if (!changed.length) {
      outcome = "unchanged";
      return;
    }
    const before = Object.fromEntries(changed.map((id) => [id, r.answers[id] ?? ""]));
    r.answers = answers;
    r.events.push({ id: newId("ev"), at: now(), type: "brief_revised", data: { changed, before } });
    r.status = "submitted";
    outcome = "revised";
  });
  if (!updated) return fail(404, "Request not found");
  if (outcome === "unchanged") return fail(400, "Nothing has changed in your brief");
  if (outcome === "closed") return fail(409, "This brief can no longer be edited");

  await handOff(updated);
  return json({ ok: true });
}
