import { fail, json } from "@/lib/http";
import { getRequest, updateRequest } from "@/lib/db";
import { isOttoAuthorized } from "@/lib/otto";
import { ASSET_TYPES, saveAsset } from "@/lib/assets";

/**
 * Upload a result image or the final PDF (multipart field "file").
 * Reference it in the results payload as `asset:<name>`.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/otto/requests/[id]/assets">) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail(400, "No file received");
  if (!ASSET_TYPES[file.type]) return fail(415, `Unsupported type ${file.type}`);
  if (file.size > 50 * 1024 * 1024) return fail(413, "Max 50 MB");

  const asset = await saveAsset(id, file);
  await updateRequest(id, (r) => {
    r.assets.push(asset);
  });
  return json({ ref: `asset:${asset.name}` }, 201);
}
