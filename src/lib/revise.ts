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
