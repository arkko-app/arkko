"use client";

import Link from "next/link";
import { velaResults, DEMO_TOKEN } from "@/lib/seed";
import { Ctx } from "../showcase/context";
import { Overview, SECTION_META } from "../showcase/sections";
import { Icon } from "../icons";
import { Logo } from "../ui";
import type { SectionId } from "@/lib/types";

const NAV: SectionId[] = ["overview", "brief", "opportunity", "landscape", "risks", "evidence"];

/** The real Overview section, rendered inside a product frame on a collage backdrop. */
export function ShowcasePreview() {
  const data = { payload: velaResults, briefImages: [], version: 1, updatedAt: "2026-10-13T16:00:00.000Z" };
  const ctx = {
    data,
    sections: [] as SectionId[], // in-frame links are inert; the whole frame links to the demo
    presenting: false,
    goTo: () => undefined,
    sourceNumber: () => undefined,
  };
  return (
    <figure>
      <div className="relative overflow-hidden rounded-[20px] bg-[#e6d3b3] px-3 py-10 sm:px-10 sm:py-16 lg:px-24">
        <Collage />
        <Link
          href={`/r/${DEMO_TOKEN}`}
          className="group relative z-10 block overflow-hidden rounded-xl border border-ink/80 bg-bg shadow-[0_30px_80px_-20px_rgba(40,25,10,0.45)] transition-transform hover:-translate-y-0.5"
          aria-label="Open the example results showcase"
        >
          <div className="flex">
            <div className="hidden w-[200px] shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
              <div className="px-2"><Logo href={null} /></div>
              <div className="mt-8 space-y-1">
                {NAV.map((id, i) => (
                  <div key={id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] ${i === 0 ? "bg-brand-soft font-semibold text-brand-text" : "text-ink"}`}>
                    <Icon name={SECTION_META[id].icon} size={14} className={i ? "text-ink-2" : ""} />
                    {SECTION_META[id].label}
                  </div>
                ))}
              </div>
              <div className="mt-auto flex items-center gap-2.5 border-t border-line px-2 pt-4">
                <span className="grid size-7 place-items-center rounded-md bg-brand font-serif text-xs font-bold text-brand-ink">V</span>
                <div className="leading-tight">
                  <div className="text-xs font-semibold">VELA</div>
                  <div className="text-[10px] text-muted">Client workspace</div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none min-w-0 flex-1 select-none" aria-hidden>
              <div className="flex h-14 items-center gap-2 border-b border-line px-6 text-[12px]">
                <span className="font-semibold tracking-wide">VELA</span>
                <span className="text-muted">/</span>
                <span className="truncate text-ink-2">Afternoon Beverage Opportunity</span>
                <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-text sm:inline-flex">
                  <span className="size-1.5 rounded-full bg-accent-dot" /> Exploratory
                </span>
                <span className="hidden h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[12px] font-semibold sm:inline-flex">
                  <Icon name="monitor" size={13} /> Present
                </span>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-2.5 text-[12px] font-semibold text-brand-ink">
                  <Icon name="download" size={13} /> <span className="hidden sm:inline">Download brief</span>
                </span>
              </div>
              <div className="p-5 sm:p-7">
                <Ctx.Provider value={ctx}>
                  <Overview />
                </Ctx.Provider>
                <p className="mt-6 text-[11px] text-muted">{velaResults.disclaimer}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <figcaption className="mt-3 text-sm text-ink-2">
        Illustrative screen. VELA is a fictional brand; findings and concepts shown are examples, not client work.
      </figcaption>
    </figure>
  );
}

function Collage() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
      {/* paper texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,.35),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(120,80,40,.18),transparent_45%)]" />
      {/* magazine page */}
      <div className="absolute -top-6 left-[18%] h-48 w-[62%] rotate-[-2deg] bg-[#f3eee4] shadow-md">
        <div className="px-8 pt-10 font-serif text-[64px] font-black leading-none tracking-tight text-[#1b1b1b]">THE APERITIF</div>
        <div className="px-8 pt-2 text-xl font-bold tracking-wide text-[#1b1b1b]/80">APPETITE-DRIVEN SENSORY</div>
      </div>
      {/* lime card */}
      <div className="absolute -left-6 -top-4 h-64 w-56 rotate-[-8deg] bg-[#b9de6a] shadow-md">
        <div className="mt-24 ml-10 h-12 w-40 rotate-[4deg] rounded bg-[#f08cb0]" />
      </div>
      {/* starburst */}
      <div className="absolute left-[-2%] top-[34%] size-28 bg-[#e8452c] [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]" />
      <div className="absolute left-[10%] top-[8%] size-16 bg-[#1b1b1b] [clip-path:polygon(50%_0,58%_40%,100%_50%,58%_60%,50%_100%,42%_60%,0_50%,42%_40%)]" />
      <div className="absolute right-[34%] top-[2%] size-12 bg-[#1b1b1b] [clip-path:polygon(50%_0,58%_40%,100%_50%,58%_60%,50%_100%,42%_60%,0_50%,42%_40%)]" />
      {/* pencil */}
      <div className="absolute right-[6%] top-[-4%] h-[46%] w-3 rotate-[-28deg] rounded-full bg-gradient-to-b from-[#c98a4b] via-[#d79a5c] to-[#f1e6d3]" />
      {/* side headline */}
      <div className="absolute left-[-1%] top-[42%] hidden font-serif text-[90px] font-black leading-[0.85] text-[#1b1b1b] lg:block">THE<br />APE</div>
      {/* ovals */}
      <div className="absolute -bottom-12 left-[12%] grid h-40 w-80 rotate-[-6deg] place-items-center rounded-[50%] border-[10px] border-[#1b1b1b] bg-[#b9de6a]">
        <span className="font-sans text-[64px] font-black tracking-tight text-[#1b1b1b]">IDEA</span>
      </div>
      <div className="absolute -bottom-14 left-[38%] grid h-40 w-[22rem] rotate-[3deg] place-items-center rounded-[50%] border-[10px] border-[#1b1b1b] bg-[#f2d36b]">
        <span className="font-sans text-[56px] font-black tracking-tight text-[#1b1b1b]">CONCEPT</span>
      </div>
      <div className="absolute -bottom-16 right-[6%] h-40 w-72 rotate-[-4deg] rounded-[50%] bg-[#d9483b]" />
      {/* binder clips */}
      <div className="absolute left-[3%] top-[62%] size-14 rotate-12 rounded-md border-4 border-[#5d5a3a] bg-[#7b7650]/40" />
      <div className="absolute left-[6%] top-[76%] size-12 -rotate-6 rounded-md border-4 border-[#6e3b2a] bg-[#8a4a33]/40" />
      {/* leaves */}
      <div className="absolute bottom-[12%] right-[1%] h-24 w-10 rotate-[30deg] rounded-[50%] bg-[#4f7a3a]" />
      <div className="absolute bottom-[20%] right-[4%] h-16 w-7 rotate-[60deg] rounded-[50%] bg-[#5f8a47]" />
    </div>
  );
}
