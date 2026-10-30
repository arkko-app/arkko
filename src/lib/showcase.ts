import "server-only";
import { canRevise } from "./revise";
import { signedFileUrl } from "./sign";
import type { RequestRecord, ResultImage, ResultsPayload } from "./types";

/** Turn `asset:<name>` refs into signed URLs and pick the intake images to show. */
export function buildShowcaseData(rec: RequestRecord) {
  const latest = rec.results!.at(-1)!;
  const resolve = (src: string) => (src.startsWith("asset:") ? signedFileUrl(rec.id, src.slice(6)) : src);
  const img = (i?: ResultImage) => (i ? { ...i, src: resolve(i.src) } : undefined);

  const p = structuredClone(latest.payload) as ResultsPayload;
  // Results published before 2026-10-29 name an "AI specialist team"; show them in the current wording.
  if (p.project.stage === "Desk research · AI specialist team") p.project.stage = "Desk research · Specialist team";
  p.disclaimer = p.disclaimer?.replace("Arkko's AI specialist team", "Arkko's specialist research team");
  p.concept.image = img(p.concept.image);
  if (p.deliverables?.pdf) p.deliverables.pdf = resolve(p.deliverables.pdf);
  if (p.brief?.images) p.brief.images = p.brief.images.map((i) => img(i)!);
  p.landscape?.competitors.forEach((c) => (c.image = img(c.image)));

  const ids = p.brief?.imageIds;
  const intakeImages: ResultImage[] = rec.images
    .filter((i) => !ids || ids.includes(i.id))
    .map((i) => ({ src: signedFileUrl(rec.id, i.name), alt: i.originalName, label: "Submitted image" }));

  return {
    access: {
      token: rec.resultsToken,
      email: rec.email,
      emailSent: rec.events.some((e) => e.type === "final_email_sent"),
      canRevise: canRevise(rec),
    },
    payload: p,
    briefImages: p.brief?.images ?? intakeImages,
    version: latest.version,
    updatedAt: latest.receivedAt,
  };
}

/** Resolve `asset:` image refs on review versions so the status page can show them. */
export function withResolvedReviewImages(rec: RequestRecord): RequestRecord {
  return {
    ...rec,
    reviews: rec.reviews.map((r) =>
      r.image?.src.startsWith("asset:")
        ? { ...r, image: { ...r.image, src: signedFileUrl(rec.id, r.image.src.slice(6)) } }
        : r,
    ),
  };
}
