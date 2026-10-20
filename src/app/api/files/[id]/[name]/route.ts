import { fail } from "@/lib/http";
import { getRequest, readFile } from "@/lib/db";
import { verifyFileSignature } from "@/lib/sign";

/** Serve a stored file to holders of a valid signed URL (Otto, or a results page). */
export async function GET(req: Request, ctx: RouteContext<"/api/files/[id]/[name]">) {
  const { id, name } = await ctx.params;
  const url = new URL(req.url);
  if (!verifyFileSignature(id, name, url.searchParams.get("exp") ?? "", url.searchParams.get("sig") ?? ""))
    return fail(403, "Link expired or invalid");
  const rec = await getRequest(id);
  const file = [...(rec?.images ?? []), ...(rec?.assets ?? [])].find((f) => f.name === name);
  if (!file) return fail(404, "File not found");
  const data = await readFile(id, name);
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": file.contentType,
      "cache-control": "private, max-age=3600",
      "content-disposition": `inline; filename="${file.originalName.replace(/"/g, "")}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
