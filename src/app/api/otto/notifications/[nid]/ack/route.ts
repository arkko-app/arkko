import { fail, json } from "@/lib/http";
import { ackNotification } from "@/lib/db";
import { isOttoAuthorized } from "@/lib/otto";

export async function POST(req: Request, ctx: RouteContext<"/api/otto/notifications/[nid]/ack">) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const { nid } = await ctx.params;
  const n = await ackNotification(nid);
  if (!n) return fail(404, "Notification not found");
  return json({ notification: n });
}
