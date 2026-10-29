import { fail, json } from "@/lib/http";
import { getRequest, updateRequest } from "@/lib/db";
import { isOttoAuthorized } from "@/lib/otto";
import { saveAsset } from "@/lib/assets";

/**
 * Hosted uploads are capped at 4.5 MB per request, and a stored file is kept in Airtable only up to 5 MB, so a
 * larger PDF could not be served back later.
 */
const MAX_PDF_BYTES = 4 * 1024 * 1024;

/**
 * Attach the PDF of a results version (multipart fields "file" and "version"). The PDF is made from the
 * published results page, so it is added to that version rather than published as a new one. A PDF made from
 * a version that has since been replaced is refused.
 */
export async function PUT(req: Request, ctx: RouteContext<"/api/otto/requests/[id]/results/pdf">) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec?.results?.length) return fail(404, "No results for this request");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const version = Number(form?.get("version"));
  if (!(file instanceof File)) return fail(400, "No file received");
  if (file.type !== "application/pdf") return fail(415, `Expected application/pdf, got ${file.type}`);
  if (file.size > MAX_PDF_BYTES) return fail(413, "Max 4 MB");
  if (version !== rec.results.at(-1)!.version) return fail(409, "These results have a newer version");

  const asset = await saveAsset(id, file);
  const updated = await updateRequest(id, (r) => {
    const latest = r.results!.at(-1)!;
    if (latest.version !== version) return;
    r.assets.push(asset);
    latest.payload.deliverables = { ...latest.payload.deliverables, pdf: `asset:${asset.name}`, pdfLabel: "Download PDF" };
  });
  if (updated?.results?.at(-1)?.version !== version) return fail(409, "These results have a newer version");
  return json({ ref: `asset:${asset.name}`, version });
}
