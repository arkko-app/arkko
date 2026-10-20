import { fail, json } from "@/lib/http";
import { getRequest, newId, now, updateRequest } from "@/lib/db";
import { intakeForOtto, isOttoAuthorized } from "@/lib/otto";

/** Otto confirms it has the request. Idempotent. */
export async function POST(req: Request, ctx: RouteContext<"/api/otto/requests/[id]/ack">) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");
  const updated = await updateRequest(id, (r) => {
    if (r.status === "submitted" || r.status === "handoff_failed") r.status = "handed_off";
    if (!r.events.some((e) => e.type === "received"))
      r.events.push({ id: newId("ev"), type: "received", at: now() });
  });
  return json({ request: intakeForOtto(updated!) });
}
