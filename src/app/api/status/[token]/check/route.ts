import { fail, json } from "@/lib/http";
import { getByResultsToken, peekByResultsToken } from "@/lib/db";
import { restartDue, restartIfStuck } from "@/lib/otto";

/**
 * Polled by the status page: returns when the request last changed, so the page only reloads when
 * something new happened. Reads one Airtable row instead of the whole request. While a brief still
 * waits to be picked up, it also restarts the engine if the first start never got through.
 */
export async function POST(_req: Request, ctx: RouteContext<"/api/status/[token]/check">) {
  const { token } = await ctx.params;
  const peek = await peekByResultsToken(token);
  if (!peek || peek.status === "draft") return fail(404, "Request not found");
  if (peek.status === "submitted" && restartDue(peek.updatedAt)) {
    const rec = await getByResultsToken(token);
    if (rec) await restartIfStuck(rec);
  }
  return json({ updatedAt: peek.updatedAt });
}
