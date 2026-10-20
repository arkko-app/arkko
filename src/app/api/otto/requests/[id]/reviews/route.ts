import { fail, json } from "@/lib/http";
import { reviewSchema } from "@/lib/schema";
import { getRequest, newId, now, updateRequest } from "@/lib/db";
import { isOttoAuthorized } from "@/lib/otto";
import { statusUrl } from "@/lib/sign";
import { isApproved, reviewsFor } from "@/lib/stage";
import type { Review } from "@/lib/types";

/**
 * Post an idea or concept version for the user to review on their status page.
 * Versions number themselves per stage. The concept can't be posted before the
 * idea is approved, and nothing can be posted for a stage that is already approved.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/otto/requests/[id]/reviews">) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");

  const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid review", parsed.error.issues);
  const input = parsed.data;

  let review: Review | undefined;
  let conflict: string | undefined;
  await updateRequest(id, (r) => {
    if (isApproved(r, input.stage)) conflict = `The ${input.stage} is already approved`;
    else if (input.stage === "concept" && !isApproved(r, "idea")) conflict = "The idea must be approved first";
    if (conflict) return;
    review = {
      ...input,
      id: newId("rev"),
      version: (reviewsFor(r, input.stage).at(-1)?.version ?? 0) + 1,
      createdAt: now(),
    };
    r.reviews.push(review);
    r.events.push({ id: newId("ev"), type: "review_posted", at: now(), version: review.version, data: { stage: review.stage } });
    if (r.status !== "results_ready") r.status = "in_progress";
  });
  if (conflict) return fail(409, conflict);
  return json({ review, statusUrl: statusUrl(rec.resultsToken) }, 201);
}
