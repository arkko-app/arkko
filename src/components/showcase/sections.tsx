"use client";

import { useState, type ReactNode } from "react";
import type { ClaimKind, Finding, ResultImage, SectionId } from "@/lib/types";
import { Icon, type IconName } from "../icons";
import { Chip } from "../ui";
import { Chart } from "./Chart";
import { EmailResults } from "../status/actions";
import { useShowcase } from "./context";

export const SECTION_META: Record<SectionId, { label: string; icon: IconName; eyebrow: string; title: string }> = {
  overview: { label: "Overview", icon: "grid", eyebrow: "", title: "" },
  brief: { label: "Concept", icon: "bulb", eyebrow: "From brief to concept", title: "What you asked for, and what it became" },
  opportunity: { label: "Opportunity", icon: "target", eyebrow: "Why this opportunity", title: "The case for the concept" },
  landscape: { label: "Landscape", icon: "landscape", eyebrow: "Competitive landscape", title: "Where it sits in the market" },
  risks: { label: "Next steps", icon: "arrowRight", eyebrow: "Risks and next tests", title: "What we still need to learn" },
  evidence: { label: "Evidence", icon: "file", eyebrow: "Evidence and deliverables", title: "Sources and the full brief" },
};

/* ---------------------------------------------------------------- */

function SectionHeader({ id }: { id: SectionId }) {
  const m = SECTION_META[id];
  return (
    <header className="mb-6">
      <div className="eyebrow text-brand-text">{m.eyebrow}</div>
      <h2 className="mt-2 font-serif text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[34px]">
        {m.title}
      </h2>
    </header>
  );
}

function Img({ image, className = "" }: { image: ResultImage; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-surface-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- payload images are arbitrary signed URLs */}
      <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
      {(image.label || image.illustrative) && (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm">
          {image.label ?? "Illustrative image"}
        </span>
      )}
    </div>
  );
}

const KIND: Record<ClaimKind, { label: string; tone: "brand" | "outline" | "dashed"; icon: IconName }> = {
  sourced: { label: "Sourced finding", tone: "brand", icon: "check" },
  interpretation: { label: "Otto's interpretation", tone: "outline", icon: "bulb" },
  assumption: { label: "Assumption to validate", tone: "dashed", icon: "flag" },
};

export function KindChip({ kind }: { kind: ClaimKind }) {
  const k = KIND[kind];
  return (
    <Chip tone={k.tone}>
      <Icon name={k.icon} size={11} />
      {k.label}
    </Chip>
  );
}

export function SourceRefs({ ids }: { ids?: string[] }) {
  const { goTo, sourceNumber } = useShowcase();
  if (!ids?.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="text-xs text-muted">Source</span>
      {ids.map((id) => {
        const n = sourceNumber(id);
        if (!n) return null;
        return (
          <button
            key={id}
            type="button"
            onClick={() => goTo("evidence", `source-${id}`)}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line px-1 text-[11px] font-semibold text-brand-text hover:border-brand"
            aria-label={`Source ${n}`}
          >
            {n}
          </button>
        );
      })}
    </span>
  );
}

function NavLink({ to, children }: { to: SectionId; children: ReactNode }) {
  const { goTo, sections } = useShowcase();
  if (!sections.includes(to)) return null;
  return (
    <button type="button" onClick={() => goTo(to)} className="link-arrow">
      {children} <Icon name="arrowRight" size={13} />
    </button>
  );
}

/* ---------------------------------------------------------------- */

export function Overview() {
  const { data } = useShowcase();
  const { concept, pillars, nextTest } = data.payload;
  const rows = [
    { icon: "user" as const, k: "Who", v: concept.who },
    { icon: "clock" as const, k: "When", v: concept.when },
    { icon: "drop" as const, k: "Proposition", v: concept.promise },
  ].filter((r) => r.v);

  return (
    <div>
      {concept.eyebrow && <div className="eyebrow text-brand-text">{concept.eyebrow}</div>}
      <h1 className="mt-2 font-serif text-[40px] font-bold leading-[1.05] tracking-tight text-ink sm:text-[52px]">
        {concept.headline}
      </h1>
      <p className="mt-3 text-[17px] text-ink-2">{concept.proposition}</p>

      <div className={`mt-7 grid gap-4 ${concept.image && rows.length ? "lg:grid-cols-[1.35fr_1fr]" : ""}`}>
        {concept.image && <Img image={concept.image} className="aspect-[16/9] lg:aspect-auto lg:min-h-[340px]" />}
        {rows.length > 0 && (
          <div className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <div className="eyebrow text-ink-2">The opportunity</div>
            <dl className="mt-4 divide-y divide-line">
              {rows.map((r) => (
                <div key={r.k} className="flex items-center gap-4 py-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-2">
                    <Icon name={r.icon} size={16} />
                  </span>
                  <div>
                    <dt className="eyebrow text-[10px] text-brand-text">{r.k}</dt>
                    <dd className="mt-0.5 text-[17px] font-medium text-ink">{r.v}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-auto pt-4">
              <NavLink to="brief">Explore the concept</NavLink>
            </div>
          </div>
        )}
      </div>

      {pillars && pillars.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <div key={p.label} className="rounded-2xl border border-line bg-surface p-5">
              <div className="eyebrow text-[10px] text-ink-2">{p.label}</div>
              <div className="mt-2 font-serif text-[19px] font-semibold text-ink">{p.title}</div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Chip tone={i === 2 ? "dashed" : "neutral"}>{p.status}</Chip>
                <NavLink to={p.target}>{p.linkLabel}</NavLink>
              </div>
            </div>
          ))}
        </div>
      )}

      {nextTest && <NextToValidate />}
    </div>
  );
}

function NextToValidate() {
  const { data } = useShowcase();
  const t = data.payload.nextTest!;
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-accent-line bg-accent-soft px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="eyebrow shrink-0 text-[10px] text-accent-text">Next to validate</div>
      <div className="flex-1 text-[16px] font-medium text-ink">{t.question}</div>
      <NavLink to="risks">View next test</NavLink>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function Brief() {
  const { data } = useShowcase();
  const { brief, concept } = data.payload;
  const images = data.briefImages;
  return (
    <div>
      <SectionHeader id="brief" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <div className="eyebrow text-ink-2">What you asked for</div>
          {brief?.summary && <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{brief.summary}</p>}
          {brief?.quotes?.map((q) => (
            <blockquote key={q} className="mt-4 border-l-2 border-accent-dot pl-4 font-serif text-[18px] italic text-ink">
              “{q}”
            </blockquote>
          ))}
          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {images.map((img) => (
                <Img key={img.src} image={img} className="aspect-[4/3]" />
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-brand/20 bg-brand-soft/50 p-6">
          <div className="eyebrow text-brand-text">What it became</div>
          <div className="mt-3 font-serif text-[26px] font-bold text-ink">{concept.name}</div>
          <p className="mt-1 text-[15px] text-ink-2">{concept.proposition}</p>
          {brief?.transformation && brief.transformation.length > 0 && (
            <ul className="mt-5 space-y-3">
              {brief.transformation.map((t) => (
                <li key={t.from} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-surface p-3 text-sm">
                  <span className="text-muted">{t.from}</span>
                  <Icon name="arrowRight" size={14} className="text-brand-text" />
                  <span className="font-medium text-ink">{t.to}</span>
                </li>
              ))}
            </ul>
          )}
          {concept.image?.illustrative && (
            <p className="mt-5 text-xs text-muted">Concept imagery is illustrative and generated for discussion.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function FindingCard({ f }: { f: Finding }) {
  const { data } = useShowcase();
  const [open, setOpen] = useState(false);
  const chart = f.chartId ? data.payload.charts?.find((c) => c.id === f.chartId) : undefined;
  return (
    <div className={`rounded-2xl border bg-surface p-5 ${f.kind === "assumption" ? "border-dashed border-line-strong" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <KindChip kind={f.kind} />
        <SourceRefs ids={f.sourceIds} />
      </div>
      <h3 className="mt-3 font-serif text-[20px] font-semibold text-ink">{f.title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{f.summary}</p>
      {/* The data behind a finding is shown with it, not behind a toggle. */}
      {chart && (
        <div className="mt-4">
          <Chart chart={chart} cite={<SourceRefs ids={chart.sourceIds} />} />
        </div>
      )}
      {f.detail && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-text"
          >
            {open ? "Hide detail" : "Show detail"}
            <Icon name="chevronDown" size={14} className={open ? "rotate-180" : ""} />
          </button>
          {open && <p className="mt-3 text-sm leading-relaxed text-ink-2">{f.detail}</p>}
        </>
      )}
    </div>
  );
}

export function Opportunity() {
  const { data } = useShowcase();
  const findings = data.payload.findings ?? [];
  const linked = new Set(findings.map((f) => f.chartId).filter(Boolean));
  const loose = (data.payload.charts ?? []).filter((c) => !linked.has(c.id));
  return (
    <div>
      <SectionHeader id="opportunity" />
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>How to read this:</span>
        <KindChip kind="sourced" />
        <KindChip kind="interpretation" />
        <KindChip kind="assumption" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {findings.map((f) => (
          <FindingCard key={f.id} f={f} />
        ))}
      </div>
      {loose.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {loose.map((c) => (
            <Chart key={c.id} chart={c} cite={<SourceRefs ids={c.sourceIds} />} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function Landscape() {
  const { data } = useShowcase();
  const l = data.payload.landscape!;
  const conceptName = data.payload.concept.name;
  return (
    <div>
      <SectionHeader id="landscape" />
      {l.summary && <p className="mb-5 max-w-3xl text-[15px] leading-relaxed text-ink-2">{l.summary}</p>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-3.5 eyebrow text-[10px] font-semibold text-ink-2">Product</th>
              {l.attributes.map((a) => (
                <th key={a} className="px-5 py-3.5 eyebrow text-[10px] font-semibold text-ink-2">{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {l.competitors.map((c) => {
              const ours = c.name === conceptName;
              return (
                <tr key={c.name} className={`border-b border-line last:border-0 ${ours ? "bg-brand-soft/60" : ""}`}>
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-3">
                      {c.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image.src} alt={c.image.alt} className="size-10 rounded-md object-cover" />
                      )}
                      <div>
                        <div className={`font-semibold ${ours ? "text-brand-text" : "text-ink"}`}>{c.name}</div>
                        {c.brand && <div className="text-xs text-muted">{c.brand}</div>}
                        <div className="mt-1"><SourceRefs ids={c.sourceIds} /></div>
                      </div>
                    </div>
                  </td>
                  {l.attributes.map((a) => (
                    <td key={a} className="px-5 py-4 align-top text-ink-2">
                      {c.attributes[a] ?? <span className="text-muted">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

const RISK_LABEL = { assumption: "Assumption", risk: "Risk", open_question: "Open question" } as const;

export function Risks() {
  const { data } = useShowcase();
  const { risks, nextTest } = data.payload;
  return (
    <div>
      <SectionHeader id="risks" />
      {nextTest && (
        <div className="mb-5 rounded-2xl border border-accent-line bg-accent-soft p-6">
          <div className="eyebrow text-[10px] text-accent-text">Next to validate</div>
          <div className="mt-2 font-serif text-[24px] font-bold text-ink">{nextTest.question}</div>
          {nextTest.method && <p className="mt-2 text-[15px] text-ink-2">{nextTest.method}</p>}
        </div>
      )}
      {risks && risks.length > 0 && (
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {risks.map((r) => (
            <div key={r.id} className="grid gap-3 p-5 md:grid-cols-[1fr_1fr] md:gap-8">
              <div>
                <Chip tone={r.kind === "risk" ? "accent" : "dashed"}>{RISK_LABEL[r.kind]}</Chip>
                <p className="mt-2 text-[16px] font-medium text-ink">{r.statement}</p>
              </div>
              {r.test && (
                <div>
                  <div className="eyebrow text-[10px] text-brand-text">Recommended validation</div>
                  <p className="mt-2 text-[15px] text-ink-2">{r.test}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function Evidence() {
  const { data } = useShowcase();
  const { sources, deliverables } = data.payload;
  return (
    <div>
      <SectionHeader id="evidence" />
      <div className={`grid gap-4 ${deliverables?.pdf || data.access ? "lg:grid-cols-[1.6fr_1fr]" : ""}`}>
        {sources && sources.length > 0 && (
          <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {sources.map((s, i) => (
              <li key={s.id} id={`source-${s.id}`} className="flex scroll-mt-24 gap-4 p-5 target:bg-accent-soft">
                <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line text-xs font-semibold text-brand-text">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-ink">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        {s.title} <Icon name="external" size={12} />
                      </a>
                    ) : (
                      s.title
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {[s.publisher, s.accessed && `Accessed ${s.accessed}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="space-y-4">
        {deliverables?.pdf && (
          <div className="flex flex-col rounded-2xl border border-line bg-surface p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-text">
              <Icon name="file" size={20} />
            </span>
            <div className="mt-4 font-serif text-[20px] font-semibold text-ink">The full brief</div>
            <p className="mt-1 text-sm text-ink-2">
              The PDF has the presentation and reference pages, with every source linked.
            </p>
            <a
              href={deliverables.pdf}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-ink hover:bg-brand-hover"
            >
              <Icon name="download" size={15} /> {deliverables.pdfLabel ?? "Download PDF"}
            </a>
          </div>
        )}
        {data.access && (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="font-serif text-[18px] font-semibold text-ink">Email me the results</div>
            <p className="mb-3 mt-1 text-sm text-ink-2">{deliverables?.pdf ? "We’ll send the PDF and a link to this page." : "We’ll email you a link to this page."}</p>
            <EmailResults
              token={data.access.token}
              email={data.access.email}
              sent={data.access.emailSent}
              resultsReady
            />
          </div>
        )}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">
        Results version {data.version} · updated {new Date(data.updatedAt).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}
      </p>
    </div>
  );
}

export const SECTION_COMPONENTS: Record<SectionId, () => ReactNode> = {
  overview: Overview,
  brief: Brief,
  opportunity: Opportunity,
  landscape: Landscape,
  risks: Risks,
  evidence: Evidence,
};
