"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SectionId } from "@/lib/types";
import { Icon } from "../icons";
import { Logo } from "../ui";
import { Ctx, type ShowcaseData } from "./context";
import { SECTION_COMPONENTS, SECTION_META } from "./sections";

/** Only sections with real content are shown. Nothing is padded with filler. */
function availableSections(d: ShowcaseData): SectionId[] {
  const p = d.payload;
  const s: SectionId[] = ["overview"];
  if (p.brief || d.briefImages.length) s.push("brief");
  if (p.findings?.length || p.charts?.length) s.push("opportunity");
  if (p.landscape?.competitors.length) s.push("landscape");
  if (p.risks?.length || p.nextTest) s.push("risks");
  if (p.sources?.length || p.deliverables?.pdf) s.push("evidence");
  return s;
}

export function Showcase({ data }: { data: ShowcaseData }) {
  const sections = useMemo(() => availableSections(data), [data]);
  const [presenting, setPresenting] = useState(false);
  const [slide, setSlide] = useState(0);
  const [active, setActive] = useState<SectionId>("overview");
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(null);
  const { payload } = data;

  const sourceNumber = useCallback(
    (id: string) => {
      const i = payload.sources?.findIndex((s) => s.id === id) ?? -1;
      return i >= 0 ? i + 1 : undefined;
    },
    [payload.sources],
  );

  const goTo = useCallback(
    (id: SectionId, anchor?: string) => {
      if (presenting) {
        setSlide(sections.indexOf(id));
        window.scrollTo({ top: 0 });
      } else {
        document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (anchor) setPendingAnchor(anchor);
    },
    [presenting, sections],
  );

  // After navigation renders, scroll to and briefly highlight a specific anchor (e.g. a source).
  useEffect(() => {
    if (!pendingAnchor) return;
    const t = setTimeout(() => {
      const el = document.getElementById(pendingAnchor);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("bg-accent-soft");
      setTimeout(() => el?.classList.remove("bg-accent-soft"), 1800);
      setPendingAnchor(null);
    }, 350);
    return () => clearTimeout(t);
  }, [pendingAnchor, slide]);

  // Scrollspy for exploration mode.
  useEffect(() => {
    if (presenting) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("section-", "") as SectionId);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    sections.forEach((id) => {
      const el = document.getElementById(`section-${id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [presenting, sections]);

  const startPresenting = useCallback(() => {
    setSlide(Math.max(0, sections.indexOf(active)));
    setPresenting(true);
    window.scrollTo({ top: 0 });
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, [active, sections]);

  const stopPresenting = useCallback(() => {
    setPresenting(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    const id = sections[slide];
    requestAnimationFrame(() => document.getElementById(`section-${id}`)?.scrollIntoView({ block: "start" }));
  }, [sections, slide]);

  // Keyboard navigation while presenting.
  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        setSlide((s) => Math.min(sections.length - 1, s + 1));
        window.scrollTo({ top: 0 });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setSlide((s) => Math.max(0, s - 1));
        window.scrollTo({ top: 0 });
      } else if (e.key === "Escape") {
        stopPresenting();
      }
    };
    const onFs = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [presenting, sections.length, stopPresenting]);

  const ctx = { data, sections, presenting, goTo, sourceNumber };
  const current = presenting ? sections[slide] : active;
  // Rendered as an element, not called as a function: a section's hooks must stay inside the section.
  const CurrentSection = SECTION_COMPONENTS[current];

  return (
    <Ctx.Provider value={ctx}>
      <div className="flex min-h-screen bg-bg print:bg-white">
        {/* Sidebar */}
        {!presenting && (
          <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-line bg-bg px-4 py-7 lg:flex print:hidden">
            <div className="px-2">
              <Logo />
            </div>
            <nav className="mt-10 space-y-1" aria-label="Sections">
              {sections.map((id) => {
                const m = SECTION_META[id];
                const on = current === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => goTo(id)}
                    aria-current={on ? "true" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] transition-colors ${
                      on ? "bg-brand-soft font-semibold text-brand-text" : "text-ink hover:bg-surface-2"
                    }`}
                  >
                    <Icon name={m.icon} size={15} className={on ? "" : "text-ink-2"} />
                    {m.label}
                  </button>
                );
              })}
            </nav>
            {data.access && (
              <Link
                href={`/r/${data.access.token}/status`}
                className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-ink-2 hover:bg-surface-2"
              >
                <Icon name="clock" size={15} /> Request status
              </Link>
            )}
            <div className={`${data.access ? "mt-3" : "mt-auto"} flex items-center gap-3 border-t border-line px-2 pt-4`}>
              <span className="grid size-8 place-items-center rounded-md bg-brand font-serif text-sm font-bold text-brand-ink">
                {payload.client.name.charAt(0)}
              </span>
              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-ink">{payload.client.name}</div>
                <div className="text-[11px] text-muted">Client workspace</div>
              </div>
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur print:static print:bg-white print:backdrop-blur-none">
            <div className={`mx-auto flex h-16 items-center gap-3 px-4 sm:px-8 print:h-10 print:px-0 ${presenting ? "max-w-[1240px]" : "max-w-[1180px]"}`}>
              <div className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
                <span className="font-semibold tracking-wide text-ink">{payload.client.name.toUpperCase()}</span>
                <span className="text-muted">/</span>
                <span className="truncate text-ink-2">{payload.project.title}</span>
              </div>
              {payload.project.stage && (
                <span className="hidden items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text sm:inline-flex">
                  <span className="size-1.5 rounded-full bg-accent-dot" />
                  {payload.project.stage}
                </span>
              )}
              {!presenting && data.access?.canRevise && (
                <Link
                  href={`/r/${data.access.token}/edit`}
                  className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:border-line-strong sm:inline-flex print:hidden"
                >
                  <Icon name="refresh" size={14} /> Edit brief
                </Link>
              )}
              {presenting ? (
                <button
                  type="button"
                  onClick={stopPresenting}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:border-line-strong"
                >
                  <Icon name="x" size={14} /> Exit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startPresenting}
                  className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:border-line-strong sm:inline-flex print:hidden"
                >
                  <Icon name="monitor" size={14} /> Present
                </button>
              )}
              {payload.deliverables?.pdf && (
                <a
                  href={payload.deliverables.pdf}
                  download
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[13px] font-semibold text-brand-ink hover:bg-brand-hover print:hidden"
                >
                  <Icon name="download" size={14} />
                  <span className="hidden sm:inline">{payload.deliverables.pdfLabel ?? "Download brief"}</span>
                </a>
              )}
            </div>
            {/* Mobile section nav */}
            {!presenting && (
              <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden print:hidden" aria-label="Sections">
                {sections.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => goTo(id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] ${
                      current === id ? "bg-brand-soft font-semibold text-brand-text" : "text-ink-2"
                    }`}
                  >
                    {SECTION_META[id].label}
                  </button>
                ))}
              </nav>
            )}
          </header>

          {presenting ? (
            <main className="mx-auto max-w-[1240px] px-4 pb-32 pt-10 sm:px-8 sm:pt-14">
              <div key={current} className="animate-[fadein_.35s_ease]">
                <CurrentSection />
              </div>
            </main>
          ) : (
            <main className="mx-auto max-w-[1180px] space-y-20 px-4 pb-16 pt-8 sm:px-8 sm:pt-10 print:space-y-12 print:px-0 print:pb-0 print:pt-6">
              {sections.map((id, i) => {
                const Section = SECTION_COMPONENTS[id];
                return (
                  // In print (the results PDF), each section starts on a new page.
                  <section key={id} id={`section-${id}`} className={`scroll-mt-24 ${i > 0 ? "print:break-before-page" : ""}`}>
                    <Section />
                  </section>
                );
              })}
              {payload.disclaimer && <p className="text-xs text-muted">{payload.disclaimer}</p>}
            </main>
          )}

          {presenting && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
              <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-4 sm:px-8">
                <button
                  type="button"
                  onClick={() => goTo(sections[Math.max(0, slide - 1)])}
                  disabled={slide === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-ink hover:bg-surface-2 disabled:opacity-30"
                >
                  <Icon name="arrowLeft" size={14} /> Back
                </button>
                <div className="flex flex-1 items-center justify-center gap-2">
                  {sections.map((id, i) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => goTo(id)}
                      aria-label={SECTION_META[id].label}
                      aria-current={i === slide ? "step" : undefined}
                      className="group flex items-center gap-2"
                    >
                      <span className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-brand" : "w-3 bg-line-strong group-hover:bg-ink-2"}`} />
                    </button>
                  ))}
                  <span className="ml-3 hidden text-[13px] text-ink-2 sm:inline">{SECTION_META[current].label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => goTo(sections[Math.min(sections.length - 1, slide + 1)])}
                  disabled={slide === sections.length - 1}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-[13px] font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-30"
                >
                  Next <Icon name="arrowRight" size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}
