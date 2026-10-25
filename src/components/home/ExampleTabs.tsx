"use client";

import { useRef, useState, type ReactNode } from "react";
import { site } from "@/content/site";

const ex = site.home.example;
const TABS = ["idea", "structured", "evaluation", "validate"] as const;
type Tab = (typeof TABS)[number];

const TONE = { pistachio: "bg-pistachio", pomelo: "bg-pomelo", amber: "bg-amber" } as const;

/** Oval label with a double ring, as in the brand's sticker component. */
function Sticker({ tone, tilt, children }: { tone: keyof typeof TONE; tilt: "left" | "right"; children: ReactNode }) {
  return (
    <span
      className={`inline-flex min-h-[60px] min-w-[104px] items-center justify-center rounded-[50%] border-[1.5px] border-ink px-3 py-2 text-center font-headline text-[14px] uppercase leading-[1.05] tracking-[0.02em] text-ink shadow-[0_0_0_2px_var(--bg),0_0_0_3px_var(--ink)] ${TONE[tone]} ${tilt === "left" ? "-rotate-2" : "rotate-2"}`}
    >
      <span className="max-w-[7em]">{children}</span>
    </span>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <p className="font-mono text-[12px] font-bold uppercase tracking-[0.08em]">{children}</p>
);

export function ExampleTabs() {
  const [tab, setTab] = useState<Tab>("idea");
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({ idea: null, structured: null, evaluation: null, validate: null });

  function onKey(e: React.KeyboardEvent) {
    const i = TABS.indexOf(tab);
    const next = e.key === "ArrowRight" ? TABS[(i + 1) % TABS.length] : e.key === "ArrowLeft" ? TABS[(i + TABS.length - 1) % TABS.length] : null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    refs.current[next]?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label="Example stages" className="flex flex-wrap gap-2" onKeyDown={onKey}>
        {TABS.map((id, i) => {
          const on = id === tab;
          return (
            <button
              key={id}
              ref={(el) => {
                refs.current[id] = el;
              }}
              type="button"
              role="tab"
              id={`example-tab-${id}`}
              aria-selected={on}
              aria-controls="example-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-lg border-[1.5px] border-ink px-[18px] py-3 text-[15px] font-bold transition-colors ${
                on ? "bg-ink text-bg" : "bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              <span className="mr-2 font-mono text-[12px]">0{i + 1}</span>
              {ex.tabs[id]}
            </button>
          );
        })}
      </div>

      <div
        id="example-panel"
        role="tabpanel"
        aria-labelledby={`example-tab-${tab}`}
        className="min-h-[360px] rounded-lg border-[1.5px] border-ink bg-surface p-[clamp(20px,4vw,44px)]"
      >
        {tab === "idea" && (
          <div className="flex flex-wrap items-start gap-10">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
              <Label>{ex.idea.label}</Label>
              <p className="font-serif text-[clamp(26px,3vw,38px)] font-black leading-[1.1] tracking-[-0.02em] text-balance">
                “{ex.idea.quote}”
              </p>
              <p className="text-[15px] text-ink-2">{ex.idea.context}</p>
            </div>
            <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2 rounded-lg bg-surface-2 p-[22px]">
              <p className="font-headline text-[18px] uppercase tracking-[0.02em]">{ex.idea.asideTitle}</p>
              <p className="text-[15px]">{ex.idea.aside}</p>
            </div>
          </div>
        )}

        {tab === "structured" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Label>{ex.structured.label}</Label>
                <p className="font-serif text-[clamp(30px,3.6vw,46px)] font-black leading-none tracking-[-0.02em]">{ex.structured.title}</p>
              </div>
              <Sticker tone="pistachio" tilt="left">{ex.structured.sticker}</Sticker>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
              {ex.structured.fields.map((f) => (
                <div key={f.label} className="rounded-lg bg-surface-2 p-[18px]">
                  <p className="mb-1.5 font-mono text-[12px] uppercase text-ink-2">{f.label}</p>
                  <p className="text-[15px] font-semibold">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "evaluation" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex max-w-[640px] flex-col gap-2">
                <Label>{ex.evaluation.label}</Label>
                <p className="text-[17px]">{ex.evaluation.summary}</p>
              </div>
              <Sticker tone="amber" tilt="right">{ex.evaluation.sticker}</Sticker>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
              {ex.evaluation.items.map((it) => (
                <div key={it.kind} className="flex flex-col gap-2.5 rounded-lg border-[1.5px] border-ink p-5">
                  <span className={`self-start rounded-lg border-[1.5px] border-ink px-2 py-0.5 font-headline text-[13px] uppercase tracking-[0.04em] ${TONE[it.tone as keyof typeof TONE]}`}>
                    {it.kind}
                  </span>
                  <p className="text-[16px] font-bold">{it.title}</p>
                  <p className="text-[15px] text-ink-2">{it.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "validate" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex max-w-[640px] flex-col gap-2">
                <Label>{ex.validate.label}</Label>
                <p className="text-[17px]">{ex.validate.summary}</p>
              </div>
              <Sticker tone="pomelo" tilt="left">{ex.validate.sticker}</Sticker>
            </div>
            <div className="flex flex-col gap-2.5">
              {ex.validate.items.map((it) => (
                <div key={it.priority} className="flex flex-wrap items-center gap-4 rounded-lg bg-surface-2 px-[18px] py-4">
                  <span className="flex flex-[0_0_168px] flex-col gap-0.5 rounded-lg border-[1.5px] border-ink bg-surface px-3 py-2">
                    <span className="font-mono text-[11px] text-ink-2">Learning priority</span>
                    <span className="text-[14px] font-bold">{it.priority}</span>
                  </span>
                  <p className="min-w-0 flex-[1_1_320px] text-[15px]">{it.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
