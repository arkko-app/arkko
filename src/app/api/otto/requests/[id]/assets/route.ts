import { fail, json } from "@/lib/http";
import { getRequest, newId, now, updateRequest, writeFile } from "@/lib/db";
import { isOttoAuthorized } from "@/lib/otto";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

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
  const ext = TYPES[file.type];
  if (!ext) return fail(415, `Unsupported type ${file.type}`);
  if (file.size > 50 * 1024 * 1024) return fail(413, "Max 50 MB");

  const name = `${newId("asset")}.${ext}`;
  await writeFile(id, name, Buffer.from(await file.arrayBuffer()));
  await updateRequest(id, (r) => {
    r.assets.push({
      id: name,
      name,
      originalName: file.name.slice(0, 200),
      contentType: file.type,
      size: file.size,
      uploadedAt: now(),
    });
  });
  return json({ ref: `asset:${name}` }, 201);
}
