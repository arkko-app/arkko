import { fail, json } from "@/lib/http";
import { getRequest } from "@/lib/db";
import { intakeForOtto, isOttoAuthorized } from "@/lib/otto";

export async function GET(req: Request, ctx: RouteContext<"/api/otto/requests/[id]">) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");
  return json({
    request: intakeForOtto(rec),
    events: rec.events,
    resultsVersion: rec.results?.at(-1)?.version ?? null,
  });
}
