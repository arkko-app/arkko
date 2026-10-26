import { fail, json } from "@/lib/http";
import { eventSchema } from "@/lib/schema";
import { newId, now, updateRequest } from "@/lib/db";
import { isOttoAuthorized } from "@/lib/otto";

/** Record workflow progress Otto owns: research started, results email sent, errors. */
export async function POST(req: Request, ctx: RouteContext<"/api/otto/requests/[id]/events">) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const { id } = await ctx.params;
  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid event", parsed.error.issues);

  // One load and one write: the request is read inside the update, not fetched separately first.
  const event = { id: newId("ev"), at: now(), ...parsed.data };
  let recorded = false;
  await updateRequest(id, (r) => {
    if (r.status === "draft") return;
    r.events.push(event);
    if (r.status === "submitted" || r.status === "handoff_failed" || r.status === "handed_off")
      r.status = "in_progress";
    recorded = true;
  });
  if (!recorded) return fail(404, "Request not found");
  return json({ event }, 201);
}
