import { fail, hasDraftAccess, json } from "@/lib/http";
import { uploadRules } from "@/lib/config";
import { getRequest, newId, now, updateRequest, writeFile } from "@/lib/db";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Upload one image to a draft request (multipart field "file"). */
export async function POST(req: Request, ctx: RouteContext<"/api/requests/[id]/images">) {
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || !hasDraftAccess(req, rec)) return fail(404, "Request not found");
  if (rec.status !== "draft") return fail(409, "This request has already been submitted");
  if (rec.images.length >= uploadRules.maxImages)
    return fail(400, `You can add up to ${uploadRules.maxImages} images`);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail(400, "No file received");
  if (!uploadRules.types.includes(file.type))
    return fail(415, "Use a JPEG, PNG, WebP or GIF image");
  if (file.size > uploadRules.maxBytes) return fail(413, "Images must be 4 MB or smaller");

  const imageId = newId("img");
  const name = `${imageId}.${EXT[file.type]}`;
  await writeFile(id, name, Buffer.from(await file.arrayBuffer()));
  const stored = {
    id: imageId,
    name,
    originalName: file.name.slice(0, 200),
    contentType: file.type,
    size: file.size,
    uploadedAt: now(),
  };
  const updated = await updateRequest(id, (r) => {
    r.images.push(stored);
  });
  if (!updated) return fail(404, "Request not found");
  return json({ image: { id: stored.id, originalName: stored.originalName, size: stored.size } }, 201);
}
