import { fail, json } from "@/lib/http";
import { emailSchema } from "@/lib/schema";
import { getByResultsToken, now, updateRequestAndNotify } from "@/lib/db";
import { pushNotification } from "@/lib/otto";

/** Ask for the results to be emailed. Otto sends the email; this records the request. */
export async function POST(req: Request, ctx: RouteContext<"/api/status/[token]/email">) {
  const { token } = await ctx.params;
  const rec = await getByResultsToken(token);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");
  if (rec.events.some((e) => e.type === "final_email_sent"))
    return fail(409, "The results have already been emailed");

  const body = await req.json().catch(() => null);
  const email = emailSchema.safeParse(body?.email);
  if (!email.success) return fail(400, "Enter a valid email address");

  const result = await updateRequestAndNotify(rec.id, (r) => {
    r.email = email.data;
    r.emailRequestedAt = now();
    return {
      type: "results_email.requested",
      data: { email: email.data, resultsReady: !!r.results?.length },
    };
  });
  await pushNotification(result?.notification);
  return json({ email: email.data });
}
