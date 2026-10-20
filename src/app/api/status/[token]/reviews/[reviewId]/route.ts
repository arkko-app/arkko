import { fail, json } from "@/lib/http";
import { decisionSchema } from "@/lib/schema";
import { getByResultsToken, newId, now, updateRequestAndNotify } from "@/lib/db";
import { pushNotification } from "@/lib/otto";

/**
 * The user approves a version or asks for changes, from their status page.
 * Only the latest undecided version of a stage can be decided, and only once.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/status/[token]/reviews/[reviewId]">) {
  const { token, reviewId } = await ctx.params;
  const rec = await getByResultsToken(token);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");

  const parsed = decisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid decision");
  const { decision, feedback } = parsed.data;

  let conflict: string | undefined;
  const result = await updateRequestAndNotify(rec.id, (r) => {
    const review = r.reviews.find((v) => v.id === reviewId);
    const latest = r.reviews.filter((v) => v.stage === review?.stage).sort((a, b) => b.version - a.version)[0];
    if (!review) conflict = "Version not found";
    else if (review.decision) conflict = "You've already responded to this version";
    else if (latest.id !== review.id) conflict = "A newer version is available";
    if (conflict || !review) return;

    review.decision = { type: decision, feedback: feedback || undefined, at: now() };
    r.events.push({
      id: newId("ev"),
      type: "review_decided",
      at: now(),
      version: review.version,
      data: { stage: review.stage, decision },
    });
    return {
      type: "review.decided",
      data: { reviewId: review.id, stage: review.stage, version: review.version, decision, feedback: feedback || null },
    };
  });
  if (!result) return fail(404, "Request not found");
  if (conflict) return fail(409, conflict);
  await pushNotification(result.notification);
  return json({ ok: true });
}
