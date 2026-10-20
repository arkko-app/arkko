import Link from "next/link";
import { currentStage, isApproved, reviewsFor, type Phase, type Stage } from "@/lib/stage";
import type { RequestRecord, Review } from "@/lib/types";
import { Icon, type IconName } from "../icons";
import { Chip, Logo } from "../ui";
import { AutoRefresh, CopyLink, EmailResults, RememberRequest, ReviewDecision } from "./actions";

const COPY: Record<string, { title: string; body: string }> = {
  "idea:developing": {
    title: "We're shaping your idea.",
    body: "Otto is turning your brief into a first idea. It will appear on this page for you to review.",
  },
  "idea:awaiting_review": {
    title: "Your idea is ready for review.",
    body: "Have a look and approve it, or tell us what to change.",
  },
  "idea:revising": {
    title: "We're revising your idea.",
    body: "Thanks for the feedback. The next version will appear here.",
  },
  "concept:developing": {
    title: "Idea approved. Building the concept.",
    body: "Otto is developing your idea into a full concept. It will appear here for you to review.",
  },
  "concept:awaiting_review": {
    title: "Your concept is ready for review.",
    body: "Approve it and we'll start the research, or tell us what to change.",
  },
  "concept:revising": {
    title: "We're revising your concept.",
    body: "Thanks for the feedback. The next version will appear here.",
  },
  "research:developing": {
    title: "Concept approved. Research is underway.",
    body: "Otto is researching the opportunity. Your results page will be ready here when it's done.",
  },
  "results:done": {
    title: "Your results are ready.",
    body: "Explore the concept, the evidence behind it, and what to test next.",
  },
};

const PHASES: { id: Phase | "brief"; label: string; icon: IconName }[] = [
  { id: "brief", label: "Brief", icon: "file" },
  { id: "idea", label: "Idea", icon: "bulb" },
  { id: "concept", label: "Concept", icon: "target" },
  { id: "research", label: "Research", icon: "landscape" },
  { id: "results", label: "Results", icon: "grid" },
];

const ORDER: Phase[] = ["idea", "concept", "research", "results"];

function phaseState(id: Phase | "brief", stage: Stage, rec: RequestRecord) {
  if (id === "brief") return "done";
  const cur = ORDER.indexOf(stage.phase);
  const me = ORDER.indexOf(id);
  if (me < cur || (id === "results" && stage.phase === "results")) return "done";
  if (me > cur) return "upcoming";
  if (id === "idea" && isApproved(rec, "idea")) return "done";
  return stage.state === "awaiting_review" ? "action" : "current";
}

const STATE_LABEL: Record<string, string> = {
  developing: "In progress",
  awaiting_review: "Your review",
  revising: "Revising",
};

export function StatusView({ rec, token }: { rec: RequestRecord; token: string }) {
  const stage = currentStage(rec);
  const copy = COPY[`${stage.phase}:${stage.state}`];
  const brand = rec.answers.brand ?? "Your brief";
  const statusPath = `/r/${token}/status`;
  const sent = rec.events.some((e) => e.type === "final_email_sent");
  const history = rec.reviews.filter((r) => r.id !== stage.pending?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const waitingOnOtto = stage.state === "developing" || stage.state === "revising";

  return (
    <div className="flex min-h-screen bg-bg">
      <RememberRequest path={statusPath} brand={brand} />
      {waitingOnOtto && <AutoRefresh />}

      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-line px-4 py-7 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <ol className="mt-10 space-y-1" aria-label="Progress">
          {PHASES.map((p) => {
            const st = phaseState(p.id, stage, rec);
            return (
              <li
                key={p.id}
                aria-current={st === "current" || st === "action" ? "step" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] ${
                  st === "current" || st === "action"
                    ? "bg-brand-soft font-semibold text-brand-text"
                    : st === "done"
                      ? "text-ink"
                      : "text-muted"
                }`}
              >
                <Icon name={st === "done" ? "check" : p.icon} size={15} />
                <span className="flex-1">{p.label}</span>
                {st === "action" && <span className="size-2 rounded-full bg-accent-dot" aria-label="Needs your review" />}
              </li>
            );
          })}
        </ol>
        <div className="mt-auto flex items-center gap-3 border-t border-line px-2 pt-4">
          <span className="grid size-8 place-items-center rounded-md bg-brand font-serif text-sm font-bold text-brand-ink">
            {brand.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold text-ink">{brand}</div>
            <div className="text-[11px] text-muted">Your request</div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1080px] items-center gap-3 px-4 sm:px-8">
            <div className="lg:hidden">
              <Logo tagline={false} />
            </div>
            <div className="hidden min-w-0 flex-1 items-center gap-2 text-[13px] lg:flex">
              <span className="truncate font-semibold tracking-wide text-ink">{brand.toUpperCase()}</span>
              <span className="text-muted">/</span>
              <span className="text-ink-2">Request status</span>
            </div>
            {stage.phase !== "results" && STATE_LABEL[stage.state] && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
                <span className="size-1.5 rounded-full bg-accent-dot" />
                {stage.phase.charAt(0).toUpperCase() + stage.phase.slice(1)} · {STATE_LABEL[stage.state]}
              </span>
            )}
            {stage.phase === "results" && (
              <Link
                href={`/r/${token}`}
                className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[13px] font-semibold text-brand-ink hover:bg-brand-hover"
              >
                View results <Icon name="arrowRight" size={14} />
              </Link>
            )}
          </div>
        </header>

        <main className="mx-auto grid max-w-[1080px] gap-8 px-4 pb-20 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <div className="eyebrow text-brand-text">Your request</div>
            <h1 className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink sm:text-[44px]">
              {copy.title}
            </h1>
            <p className="mt-2 text-[16px] text-ink-2">{copy.body}</p>

            {stage.pending && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
                <ReviewBody review={stage.pending} />
                <ReviewDecision token={token} reviewId={stage.pending.id} stage={stage.pending.stage} />
              </div>
            )}

            {waitingOnOtto && (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface p-5 text-sm text-ink-2">
                <Icon name="clock" size={16} className="shrink-0 text-muted" />
                This page checks for updates on its own. You can close it and come back with your link.
              </div>
            )}

            {stage.phase === "results" && (
              <Link
                href={`/r/${token}`}
                className="mt-8 flex items-center gap-4 rounded-2xl border border-accent-line bg-accent-soft p-5 hover:border-accent-dot"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-surface text-brand-text">
                  <Icon name="grid" size={20} />
                </span>
                <div className="flex-1">
                  <div className="font-serif text-[20px] font-semibold text-ink">Open your results</div>
                  <div className="text-sm text-ink-2">Concept, evidence, risks and the full PDF brief.</div>
                </div>
                <Icon name="arrowRight" size={18} className="text-brand-text" />
              </Link>
            )}

            {history.length > 0 && (
              <section className="mt-12">
                <h2 className="eyebrow text-ink-2">History</h2>
                <ol className="mt-4 space-y-3">
                  {history.map((r) => (
                    <HistoryItem key={r.id} review={r} />
                  ))}
                </ol>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:pt-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="eyebrow text-[10px] text-ink-2">Come back any time</div>
              <p className="mt-2 text-sm text-ink-2">This link is how you get back to your request. Keep it somewhere safe.</p>
              <div className="mt-3">
                <CopyLink path={statusPath} />
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="eyebrow text-[10px] text-ink-2">Results by email</div>
              <p className="mb-3 mt-2 text-sm text-ink-2">
                {sent || rec.email ? "" : "Optional. We'll send the PDF and your results link."}
              </p>
              <EmailResults token={token} email={rec.email} sent={sent} resultsReady={stage.phase === "results"} />
            </div>
            <ProgressSummary rec={rec} />
          </aside>
        </main>
      </div>
    </div>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split(/\n\s*\n/).map((p) => (
        <p key={p} className="text-[15px] leading-relaxed text-ink-2">
          {p}
        </p>
      ))}
    </div>
  );
}

function ReviewBody({ review }: { review: Review }) {
  return (
    <div className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow text-[10px] text-brand-text">{review.stage === "idea" ? "Idea" : "Concept"}</span>
        <Chip>Version {review.version}</Chip>
      </div>
      <h2 className="mt-3 font-serif text-[28px] font-bold leading-tight text-ink">{review.title}</h2>
      <p className="mt-2 text-[17px] text-ink">{review.summary}</p>
      {review.image && (
        <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-xl bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary URLs supplied by Otto */}
          <img src={review.image.src} alt={review.image.alt} className="h-full w-full object-cover" />
          {(review.image.label || review.image.illustrative) && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm">
              {review.image.label ?? "Illustrative image"}
            </span>
          )}
        </div>
      )}
      {review.highlights && review.highlights.length > 0 && (
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {review.highlights.map((h) => (
            <div key={h.label} className="rounded-xl bg-surface-2 p-3.5">
              <dt className="eyebrow text-[10px] text-brand-text">{h.label}</dt>
              <dd className="mt-1 text-[15px] font-medium text-ink">{h.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {review.body && (
        <div className="mt-5">
          <Paragraphs text={review.body} />
        </div>
      )}
    </div>
  );
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";

function HistoryItem({ review }: { review: Review }) {
  const d = review.decision;
  return (
    <li>
      <details className="group rounded-xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
          <span className="eyebrow w-16 shrink-0 text-[10px] text-ink-2">
            {review.stage} v{review.version}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-ink">{review.title}</span>
          {d?.type === "approved" && <Chip tone="brand"><Icon name="check" size={11} /> Approved</Chip>}
          {d?.type === "changes_requested" && <Chip tone="accent">Changes requested</Chip>}
          {!d && <Chip tone="dashed">Superseded</Chip>}
          <Icon name="chevronDown" size={15} className="text-muted group-open:rotate-180" />
        </summary>
        <div className="border-t border-line px-4 pb-4">
          <p className="mt-3 text-[15px] text-ink">{review.summary}</p>
          {review.body && (
            <div className="mt-2">
              <Paragraphs text={review.body} />
            </div>
          )}
          {d?.feedback && (
            <blockquote className="mt-4 rounded-lg border-l-2 border-accent-dot bg-accent-soft/60 px-4 py-3 text-sm text-ink">
              <div className="eyebrow mb-1 text-[10px] text-accent-text">Your feedback</div>
              {d.feedback}
            </blockquote>
          )}
          <p className="mt-3 text-xs text-muted">
            Posted {fmtDate(review.createdAt)}
            {d && ` · ${d.type === "approved" ? "Approved" : "Feedback sent"} ${fmtDate(d.at)}`}
          </p>
        </div>
      </details>
    </li>
  );
}

function ProgressSummary({ rec }: { rec: RequestRecord }) {
  const ideas = reviewsFor(rec, "idea").length;
  const concepts = reviewsFor(rec, "concept").length;
  const rows = [
    ["Submitted", rec.submittedAt ? fmtDate(rec.submittedAt).replace(/, \d+:\d+ [AP]M UTC$/, "") : "—"],
    ["Idea versions", String(ideas)],
    ["Concept versions", String(concepts)],
  ];
  return (
    <dl className="rounded-2xl border border-line bg-surface p-5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between py-1">
          <dt className="text-muted">{k}</dt>
          <dd className="font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
