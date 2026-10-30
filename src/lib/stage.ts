import { revisionPending } from "./revise";
import type { RequestRecord, Review, ReviewStage } from "./types";

export type Phase = "idea" | "concept" | "research" | "results";

export type PhaseState =
  | "developing" // Otto is working; nothing for the user to do yet
  | "awaiting_review" // a version is waiting for the user's decision
  | "revising" // the user asked for changes; Otto is working on the next version
  | "approved"
  | "done";

export interface Stage {
  phase: Phase;
  state: PhaseState;
  /** The version waiting for the user's decision, if any. */
  pending?: Review;
}

export function reviewsFor(r: Pick<RequestRecord, "reviews">, stage: ReviewStage) {
  return r.reviews.filter((v) => v.stage === stage).sort((a, b) => a.version - b.version);
}

export function isApproved(r: Pick<RequestRecord, "reviews">, stage: ReviewStage) {
  return reviewsFor(r, stage).some((v) => v.decision?.type === "approved");
}

function reviewState(r: Pick<RequestRecord, "reviews">, stage: ReviewStage): Stage {
  const latest = reviewsFor(r, stage).at(-1);
  if (!latest) return { phase: stage, state: "developing" };
  if (!latest.decision) return { phase: stage, state: "awaiting_review", pending: latest };
  if (latest.decision.type === "changes_requested") return { phase: stage, state: "revising" };
  return { phase: stage, state: "approved" };
}

/** Where a request is, derived only from what has actually been recorded. */
export function currentStage(r: Pick<RequestRecord, "reviews" | "results" | "events">): Stage {
  // An edited brief goes back to research until its new results are published.
  if (r.results?.length && !revisionPending(r)) return { phase: "results", state: "done" };
  // Without idea or concept versions, the brief goes straight to research (the coordinator turns it into the research brief).
  if (!r.reviews.length) return { phase: "research", state: "developing" };
  if (!isApproved(r, "idea")) return reviewState(r, "idea");
  if (!isApproved(r, "concept")) return reviewState(r, "concept");
  return { phase: "research", state: "developing" };
}
