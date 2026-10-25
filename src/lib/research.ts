import type { RequestRecord } from "./types";

/**
 * The research run's steps, in order. Otto records each finished step as a `research_progress`
 * event with `data.step` set to one of these ids; the request page turns them into a live checklist.
 */
export const RESEARCH_STEPS = [
  { id: "plan", label: "Research plan", detail: "Your brief becomes a research plan for the team." },
  { id: "market", label: "Market research", detail: "Category, competitors and shelf prices." },
  { id: "consumer", label: "Consumer research", detail: "Needs, occasions and reasons to buy." },
  { id: "feasibility", label: "Feasibility research", detail: "Production, rules, costs and channels." },
  { id: "evaluation", label: "Evaluation", detail: "The evidence is scored and checked for risks." },
  { id: "report", label: "Your results page", detail: "Everything is brought together for you." },
] as const;

/** Research runs per brief, counting automatic retries after a failure. Keep in step with MAX_RUNS in otto-engine. */
export const RESEARCH_MAX_RUNS = 3;

export type ResearchStepId = (typeof RESEARCH_STEPS)[number]["id"];
export type StepStatus = "done" | "active" | "waiting";

/** Steps that may start once these are done. The three researchers work in parallel. */
const NEEDS: Record<ResearchStepId, ResearchStepId[]> = {
  plan: [],
  market: ["plan"],
  consumer: ["plan"],
  feasibility: ["plan"],
  evaluation: ["market", "consumer", "feasibility"],
  report: ["evaluation"],
};

export interface ResearchProgress {
  /** queued: waiting for Otto to start; running: in progress; failed: the latest run stopped with an error. */
  state: "queued" | "running" | "failed";
  startedAt?: string;
  /** After a failure: whether Otto will try again automatically. */
  willRetry: boolean;
  steps: { id: ResearchStepId; label: string; detail: string; status: StepStatus }[];
}

/** Where the latest research run is, from the request's recorded events only. */
export function researchProgress(rec: Pick<RequestRecord, "events">): ResearchProgress {
  // Only the latest run counts: a rerun starts again from a new research_started event.
  const start = rec.events.findLastIndex((e) => e.type === "research_started");
  const run = start >= 0 ? rec.events.slice(start) : [];
  const done = new Set(run.filter((e) => e.type === "research_progress").map((e) => e.data?.step as string));
  const failed = start >= 0 && run.some((e) => e.type === "error");

  const steps = RESEARCH_STEPS.map((s) => {
    const status: StepStatus = done.has(s.id)
      ? "done"
      : start >= 0 && !failed && NEEDS[s.id].every((n) => done.has(n))
        ? "active"
        : "waiting";
    return { id: s.id, label: s.label, detail: s.detail, status };
  });

  const runs = rec.events.filter((e) => e.type === "research_started").length;
  return {
    state: start < 0 ? "queued" : failed ? "failed" : "running",
    startedAt: start >= 0 ? rec.events[start].at : undefined,
    willRetry: failed && runs < RESEARCH_MAX_RUNS,
    steps,
  };
}
