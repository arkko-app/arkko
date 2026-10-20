import { fail, hasDraftAccess, json } from "@/lib/http";
import { getRequest, updateRequest } from "@/lib/db";

export async function DELETE(req: Request, ctx: RouteContext<"/api/requests/[id]/images/[imageId]">) {
  const { id, imageId } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || !hasDraftAccess(req, rec)) return fail(404, "Request not found");
  if (rec.status !== "draft") return fail(409, "This request has already been submitted");
  await updateRequest(id, (r) => {
    r.images = r.images.filter((i) => i.id !== imageId);
  });
  return json({ ok: true });
}
