import Link from "next/link";
import { site } from "@/content/site";
import { DEMO_TOKEN } from "@/lib/seed";
import { ButtonLink, Logo } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { ShowcasePreview } from "@/components/site/ShowcasePreview";
import { ContinueRequest } from "@/components/site/ContinueRequest";

const OFFER_ICONS: IconName[] = ["bulb", "target", "file"];

export default function Home() {
  return (
    <div className="flex-1">
      <header className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-6 sm:px-8">
        <Logo tagline={false} />
        <nav className="ml-auto hidden items-center gap-7 text-sm text-ink-2 md:flex">
          <a href="#offering" className="hover:text-ink">What you get</a>
          <a href="#process" className="hover:text-ink">How it works</a>
          <Link href={`/r/${DEMO_TOKEN}`} className="hover:text-ink">Example</Link>
        </nav>
        <ButtonLink href="/start" className="ml-auto md:ml-0">
          {site.hero.cta}
        </ButtonLink>
      </header>

      <main>
        <ContinueRequest />
        <section className="mx-auto max-w-[1200px] px-4 pb-12 pt-10 sm:px-8 sm:pt-16">
          <div className="max-w-3xl">
            <div className="eyebrow text-brand-text">{site.hero.eyebrow}</div>
            <h1 className="mt-3 font-serif text-[44px] font-bold leading-[1.02] tracking-tight text-ink sm:text-[68px]">
              {site.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-ink-2">{site.hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/start" className="h-11 px-5">
                {site.hero.cta} <Icon name="arrowRight" size={15} />
              </ButtonLink>
              <ButtonLink href={`/r/${DEMO_TOKEN}`} variant="secondary" className="h-11 px-5">
                {site.hero.secondary}
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <ShowcasePreview />
        </section>

        <section id="offering" className="mx-auto max-w-[1200px] scroll-mt-8 px-4 pt-24 sm:px-8">
          <div className="eyebrow text-brand-text">What you get</div>
          <h2 className="mt-2 max-w-2xl font-serif text-[34px] font-bold leading-tight tracking-tight sm:text-[42px]">
            An idea, a concept, and the evidence behind it.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {site.offering.map((o, i) => (
              <div key={o.label} className="rounded-2xl border border-line bg-surface p-6">
                <span className="grid size-10 place-items-center rounded-lg bg-surface-2 text-ink-2">
                  <Icon name={OFFER_ICONS[i % OFFER_ICONS.length]} size={18} />
                </span>
                <div className="eyebrow mt-5 text-[10px] text-ink-2">{o.label}</div>
                <div className="mt-1.5 font-serif text-[22px] font-semibold text-ink">{o.title}</div>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{o.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="process" className="mx-auto max-w-[1200px] scroll-mt-8 px-4 pt-24 sm:px-8">
          <div className="eyebrow text-brand-text">How it works</div>
          <h2 className="mt-2 max-w-2xl font-serif text-[34px] font-bold leading-tight tracking-tight sm:text-[42px]">
            Five minutes to brief. You approve every step.
          </h2>
          <ol className="mt-8 grid overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-4">
            {site.process.map((p, i) => (
              <li key={p.step} className={`p-6 ${i ? "border-t border-line md:border-l md:border-t-0" : ""}`}>
                <div className="font-serif text-[15px] font-semibold text-brand-text">{p.step}</div>
                <div className="mt-3 text-[17px] font-semibold text-ink">{p.title}</div>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{p.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-8">
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-accent-line bg-accent-soft p-8 sm:flex-row sm:items-center sm:p-10">
            <div className="flex-1">
              <div className="eyebrow text-[10px] text-accent-text">Start now</div>
              <div className="mt-2 font-serif text-[28px] font-bold leading-tight text-ink sm:text-[32px]">{site.closing.title}</div>
              <p className="mt-2 text-[16px] text-ink-2">{site.closing.body}</p>
            </div>
            <ButtonLink href="/start" className="h-11 px-5">
              {site.hero.cta} <Icon name="arrowRight" size={15} />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4 px-4 py-8 text-sm text-muted sm:px-8">
          <Logo tagline={false} />
          <span>{site.tagline}</span>
          <span className="ml-auto">© {2026} Arkko</span>
        </div>
      </footer>
    </div>
  );
}
