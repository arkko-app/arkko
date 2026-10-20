import { fail, json } from "@/lib/http";
import { listNotifications } from "@/lib/db";
import { isOttoAuthorized } from "@/lib/otto";

/**
 * Things Otto needs to act on, oldest first:
 * - review.decided: the user approved a version or asked for changes (with feedback)
 * - results_email.requested: the user wants the results emailed
 * Ack each one after handling it.
 */
export async function GET(req: Request) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  return json({ notifications: await listNotifications() });
}
