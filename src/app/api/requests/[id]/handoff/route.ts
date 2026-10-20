import { fail, hasDraftAccess, json } from "@/lib/http";
import { getRequest } from "@/lib/db";
import { handOff } from "@/lib/otto";
import { publicStatus } from "@/lib/status";

/** Retry a failed handoff. No-op for any other state. */
export async function POST(req: Request, ctx: RouteContext<"/api/requests/[id]/handoff">) {
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || !hasDraftAccess(req, rec)) return fail(404, "Request not found");
  if (rec.status !== "handoff_failed") return json(publicStatus(rec));
  const updated = await handOff(rec);
  return json(publicStatus(updated ?? rec));
}
