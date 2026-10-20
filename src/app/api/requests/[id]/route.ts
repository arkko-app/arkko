import { fail, hasDraftAccess, json } from "@/lib/http";
import { cleanAnswers } from "@/lib/intake";
import { getRequest, updateRequest } from "@/lib/db";

/** Save intake answers while the request is still a draft. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/requests/[id]">) {
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || !hasDraftAccess(req, rec)) return fail(404, "Request not found");
  if (rec.status !== "draft") return fail(409, "This request has already been submitted");
  const body = await req.json().catch(() => null);
  const updated = await updateRequest(id, (r) => {
    r.answers = cleanAnswers(body?.answers);
  });
  return json({ id, answers: updated?.answers });
}
