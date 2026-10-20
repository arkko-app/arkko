import { fail, hasDraftAccess, json } from "@/lib/http";
import { getRequest } from "@/lib/db";
import { publicStatus } from "@/lib/status";

export async function GET(req: Request, ctx: RouteContext<"/api/requests/[id]/status">) {
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || !hasDraftAccess(req, rec)) return fail(404, "Request not found");
  return json(publicStatus(rec));
}
