import type { RequestRecord } from "./types";

/** How many times a customer may edit their brief after the results are ready. Each edit runs the research again. */
export const MAX_BRIEF_REVISIONS = 1;

type Events = Pick<RequestRecord, "events">;

export const revisionsUsed = (r: Events) => r.events.filter((e) => e.type === "brief_revised").length;

/** The brief was edited after its latest results, so new research is due or under way. */
export function revisionPending(r: Events) {
  const revised = r.events.findLastIndex((e) => e.type === "brief_revised");
  return revised >= 0 && revised > r.events.findLastIndex((e) => e.type === "results_published");
}

/**
 * A brief researched directly (no idea or concept rounds) can be edited once its results are ready,
 * while no other edit is being researched.
 */
export const canRevise = (r: Pick<RequestRecord, "events" | "results" | "reviews">) =>
  !!r.results?.length && !r.reviews.length && !revisionPending(r) && revisionsUsed(r) < MAX_BRIEF_REVISIONS;

/** Short names for the brief's answers, for "You changed: …". */
const FIELD_NAMES: Record<string, string> = {
  brand: "Brand",
  goal: "Goal",
  product: "Product",
  audience: "Audience",
  occasion: "Occasion",
  market: "Market",
  channels: "Channels",
  price: "Price",
  ideas: "Early ideas",
  constraints: "Constraints",
};

/** The answers the customer changed in the edit that led to this results version, if it came from an edit. */
export function changesBehind(r: Events, version: number) {
  const published = r.events.findIndex((e) => e.type === "results_published" && e.version === version);
  if (published < 0) return undefined;
  const previous = r.events.slice(0, published).findLastIndex((e) => e.type === "results_published");
  const edit = r.events.slice(previous + 1, published).findLast((e) => e.type === "brief_revised");
  if (!edit) return undefined;
  return ((edit.data?.changed as string[] | undefined) ?? []).map((id) => FIELD_NAMES[id] ?? id);
}
