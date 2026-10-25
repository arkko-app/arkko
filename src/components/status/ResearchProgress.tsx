import { researchProgress, type StepStatus } from "@/lib/research";
import type { RequestRecord } from "@/lib/types";
import { Icon } from "../icons";
import { Spinner } from "../ui";

const MARK: Record<StepStatus, React.ReactNode> = {
  done: (
    <span className="grid size-6 place-items-center rounded-full bg-pistachio text-ink">
      <Icon name="check" size={13} />
    </span>
  ),
  active: (
    <span className="grid size-6 place-items-center text-ink">
      <Spinner />
    </span>
  ),
  waiting: <span className="grid size-6 place-items-center"><span className="size-2 rounded-full bg-line" /></span>,
};

const STATUS_TEXT: Record<StepStatus, string> = { done: "Done", active: "In progress", waiting: "Waiting" };

/** Live checklist of the research run. The page refreshes itself, so this updates as Otto reports each step. */
export function ResearchProgress({ rec }: { rec: RequestRecord }) {
  const p = researchProgress(rec);

  return (
    <section aria-labelledby="progress-title" className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="progress-title" className="eyebrow text-ink-2">Research progress</h2>
        <p className="text-[13px] text-muted">Usually about 10 minutes</p>
      </div>

      {p.state === "failed" ? (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {p.willRetry
            ? "Something went wrong while researching your brief. We’ll try again automatically, usually within two hours. Your brief is safe and you don’t need to do anything."
            : "Something went wrong and we couldn’t finish your research automatically. It has been logged for our team. Your brief is safe and you don’t need to do anything."}
        </div>
      ) : p.state === "queued" ? (
        <p className="mt-4 text-sm text-ink-2">Your brief is in the queue. The research team usually starts within a minute or two.</p>
      ) : null}

      <ol className="mt-5 space-y-4">
        {p.steps.map((s) => (
          <li key={s.id} className="flex items-start gap-3">
            {MARK[s.status]}
            <div className="min-w-0">
              <p className={`text-[15px] font-semibold ${s.status === "waiting" ? "text-muted" : "text-ink"}`}>
                {s.label}
                <span className="sr-only">: {STATUS_TEXT[s.status]}</span>
              </p>
              <p className="text-[13px] text-ink-2">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
