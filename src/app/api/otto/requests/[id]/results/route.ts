import { fail, json } from "@/lib/http";
import { resultsSchema } from "@/lib/schema";
import { getRequest, newId, now, updateRequest } from "@/lib/db";
import { isOttoAuthorized } from "@/lib/otto";
import { resultsUrl } from "@/lib/sign";
import type { ResultsPayload } from "@/lib/types";

/**
 * Publish structured results. Each PUT creates a new version; the showcase
 * always renders the latest, so corrections replace earlier output.
 */
export async function PUT(req: Request, ctx: RouteContext<"/api/otto/requests/[id]/results">) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || rec.status === "draft") return fail(404, "Request not found");

  const parsed = resultsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(422, "Results payload failed validation", parsed.error.issues);

  const payload = parsed.data as ResultsPayload;
  const missingAssets = collectAssetRefs(payload).filter(
    (ref) => !rec.assets.some((a) => a.name === ref),
  );
  if (missingAssets.length)
    return fail(422, "Payload references assets that were not uploaded", { missingAssets });

  const updated = await updateRequest(id, (r) => {
    const version = (r.results?.at(-1)?.version ?? 0) + 1;
    r.results = [...(r.results ?? []), { version, receivedAt: now(), payload }];
    r.status = "results_ready";
    r.events.push({ id: newId("ev"), type: "results_published", at: now(), version });
  });
  return json({ version: updated!.results!.at(-1)!.version, resultsUrl: resultsUrl(rec.resultsToken) });
}

function collectAssetRefs(p: ResultsPayload) {
  const srcs = [
    p.concept.image?.src,
    p.deliverables?.pdf,
    ...(p.brief?.images ?? []).map((i) => i.src),
    ...(p.landscape?.competitors ?? []).map((c) => c.image?.src),
  ];
  return srcs.filter((s): s is string => !!s?.startsWith("asset:")).map((s) => s.slice(6));
}
