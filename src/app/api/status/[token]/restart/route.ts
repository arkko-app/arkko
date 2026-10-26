import { fail, json } from "@/lib/http";
import { getByResultsToken } from "@/lib/db";
import { restartIfStuck } from "@/lib/otto";

/** Called by the status page while a brief waits to be picked up; restarts the engine if it has waited too long. */
export async function POST(_req: Request, ctx: RouteContext<"/api/status/[token]/restart">) {
  const { token } = await ctx.params;
  const rec = await getByResultsToken(token);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");
  await restartIfStuck(rec);
  return json({ ok: true });
}
