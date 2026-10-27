import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import { DEMO_TOKEN } from "@/lib/seed";
import { ButtonLink, Logo } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ContinueRequest } from "@/components/site/ContinueRequest";
import { ExampleTabs } from "@/components/home/ExampleTabs";
import introLogo from "../../public/brand/intro-logo.jpg";
import heroPainting from "../../public/brand/hero-painting.jpg";
import evaluationBoard from "../../public/brand/dashboards/evaluation.png";
import scorecardBoard from "../../public/brand/dashboards/scorecard.png";
import researchBoard from "../../public/brand/dashboards/research.png";
import evaluationDetailBoard from "../../public/brand/dashboards/evaluation-detail.png";
import coverageBoard from "../../public/brand/dashboards/coverage.png";
import terraceSpritz from "../../public/brand/terrace-spritz.jpg";
import snackBar from "../../public/brand/snack-bar.jpg";
import teaSamples from "../../public/brand/tea-samples.jpg";
import dropperSamples from "../../public/brand/dropper-samples.jpg";
import swatches from "../../public/brand/swatches-windowsill.jpg";
import studioWindow from "../../public/brand/studio-window.jpg";

const h = site.home;
/** "Talk to arkko" opens the contact form; "Demo" lets visitors try arkko by giving a brief. */
const CONTACT = "/contact";
const DEMO = "/start";

const GAIN_TONE: Record<string, string> = {
  pistachio: "bg-pistachio",
  pomelo: "bg-pomelo",
  amber: "bg-amber",
  sand: "bg-surface-2",
};

const CATEGORY_IMAGES = [
  { src: terraceSpritz, alt: "A blood orange spritz on a sunlit terrace table" },
  { src: snackBar, alt: "A hand picking up a pistachio and orange-peel snack bar on travertine" },
  { src: teaSamples, alt: "A row of tea and tincture samples being tested with a dropper" },
];

const container = "mx-auto max-w-[1200px] px-4 sm:px-6";
const sectionTitle = "font-serif text-[clamp(38px,4.4vw,60px)] font-black leading-none tracking-[-0.03em] text-balance";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/** An illustrative dashboard, cropped to its top; opens full size so the detail can be read. */
function Dashboard({ src, label, alt, className = "" }: { src: StaticImageData; label: string; alt: string; className?: string }) {
  return (
    <figure className={`flex min-w-0 flex-col gap-2.5 ${className}`}>
      <a href={src.src} target="_blank" rel="noopener" className="group block overflow-hidden rounded-lg border-[1.5px] border-ink">
        <Image
          src={src}
          alt={alt}
          placeholder="blur"
          sizes="(min-width: 1200px) 1152px, 100vw"
          className="block aspect-[16/10] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </a>
      <figcaption className="flex flex-wrap justify-between gap-2 font-mono text-[12px] uppercase tracking-[0.06em]">
        <span>{label}</span>
        <a href={src.src} target="_blank" rel="noopener" className="underline underline-offset-4">
          {h.dashboards.open} ↗
        </a>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <div className="flex-1">
      {/* Opening: the logo painting fills the screen; the page scrolls up over it. */}
      <section aria-label={`${site.name}: ${site.tagline}`} className="sticky top-0 h-[100svh] overflow-hidden bg-surface-2">
        {/* On tall screens the whole painting is shown, so the logo isn't cropped, over a blurred copy of itself. */}
        <Image src={introLogo} alt="" aria-hidden fill sizes="100vw" className="scale-110 object-cover blur-2xl" />
        <Image
          src={introLogo}
          alt={`${site.name}: ${site.tagline}`}
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="intro-art object-cover object-[50%_45%] [@media(max-aspect-ratio:4/5)]:object-contain"
        />
        <a
          href="#top"
          className="absolute bottom-[max(28px,env(safe-area-inset-bottom,0px))] left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-lg border-[1.5px] border-ink bg-surface px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-ink"
        >
          Scroll <Icon name="chevronDown" size={14} />
        </a>
      </section>

      <div className="relative z-10 bg-bg shadow-[0_-24px_48px_-24px_rgba(30,10,16,0.35)]">
        {/* Header and hero on a pistachio block */}
        <div className="overflow-hidden bg-pistachio pb-20">
          <header className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-10">
            <Logo tagline={false} />
            <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] font-semibold">
              {h.nav.map((n) => (
                <a key={n.href} href={n.href} className="hidden hover:text-ink-2 md:inline">
                  {n.label}
                </a>
              ))}
              <ButtonLink href={DEMO} variant="secondary">{h.demo}</ButtonLink>
              <ButtonLink href={CONTACT}>{h.cta}</ButtonLink>
            </nav>
          </header>
          <ContinueRequest />

          <section id="top" className="mx-auto max-w-[1360px] scroll-mt-4 px-4 pt-8 sm:px-10 sm:pt-[72px]">
            <div className="relative min-[861px]:min-h-[720px]">
              <Image
                src={heroPainting}
                alt="Abstract palette-knife painting in pistachio, pomelo pink, blood orange, amber and espresso on cream"
                placeholder="blur"
                sizes="(min-width: 861px) 75vw, 100vw"
                className="block h-[clamp(360px,52vw,760px)] w-full rounded-lg border-[1.5px] border-ink object-cover min-[861px]:ml-auto min-[861px]:w-3/4"
              />
              <div className="relative mx-4 -mt-24 flex flex-col gap-5 rounded-lg border-[1.5px] border-ink bg-surface p-[clamp(28px,3.6vw,52px)] min-[861px]:absolute min-[861px]:top-1/2 min-[861px]:left-0 min-[861px]:mx-0 min-[861px]:mt-0 min-[861px]:w-[min(600px,48%)] min-[861px]:-translate-y-1/2">
                <Eyebrow>{h.hero.eyebrow}</Eyebrow>
                <h1 className="font-serif text-[clamp(40px,4.4vw,66px)] font-black leading-[0.98] tracking-[-0.03em] text-balance">
                  {h.hero.title}
                </h1>
                <p className="text-[18px] leading-normal">{h.hero.body}</p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <ButtonLink href={CONTACT} className="h-auto px-[22px] py-3.5 text-[15px]">
                    {h.cta} <Icon name="arrowRight" size={15} />
                  </ButtonLink>
                  <ButtonLink href={DEMO} variant="secondary" className="h-auto px-[22px] py-3.5 text-[15px]">
                    {h.demo}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Why Arkko: experience and differentiation, reversed */}
        <section id="why" className="scroll-mt-4 bg-espresso text-bg">
          <div className={`${container} flex flex-col gap-12 py-24`}>
            <div className="flex flex-wrap items-end gap-12">
              <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-5">
                <Eyebrow>{h.why.eyebrow}</Eyebrow>
                <h2 className={sectionTitle}>{h.why.title}</h2>
              </div>
              <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-4 text-[17px] leading-relaxed">
                {h.why.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
            <Dashboard src={evaluationBoard} label={`${h.dashboards.evaluation.label} · ${h.dashboards.note}`} alt={h.dashboards.evaluation.alt} />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
              {h.why.points.map((p, i) => (
                <div key={p.title} className="flex flex-col gap-2.5 rounded-lg border-[1.5px] border-bg p-6">
                  <p className="font-mono text-[13px]">0{i + 1}</p>
                  <h3 className="font-headline text-[26px] uppercase leading-[1.05] tracking-[0.01em]">{p.title}</h3>
                  <p className="text-[15px]">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you gain */}
        <section className={`${container} flex flex-col gap-10 pt-[104px] pb-14`}>
          <div className="flex max-w-[760px] flex-col gap-4">
            <Eyebrow>{h.gain.eyebrow}</Eyebrow>
            <h2 className={sectionTitle}>{h.gain.title}</h2>
            <p className="text-[18px]">{h.gain.body}</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
            {h.gain.cards.map((c) => (
              <div key={c.title} className={`flex min-h-[200px] flex-col justify-between gap-8 rounded-lg p-8 ${GAIN_TONE[c.tone]}`}>
                <h3 className="font-headline text-[34px] uppercase leading-[1.02] tracking-[0.01em]">{c.title}</h3>
                <p className="max-w-[420px] text-[16px]">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories photo band */}
        <section aria-label="Categories Arkko works across" className={`${container} pt-6 pb-14`}>
          <div className="flex flex-wrap items-start gap-4">
            {CATEGORY_IMAGES.map((img, i) => (
              <figure key={h.categories[i]} className={`flex min-w-0 flex-[1_1_300px] flex-col gap-2.5 ${i === 1 ? "sm:pt-12" : ""}`}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  placeholder="blur"
                  sizes="(min-width: 1000px) 384px, 100vw"
                  className="block h-[360px] w-full rounded-lg object-cover"
                />
                <figcaption className="font-mono text-[12px] uppercase tracking-[0.06em]">{h.categories[i]}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* What you get */}
        <section id="get" className={`${container} flex scroll-mt-4 flex-col gap-10 py-14`}>
          <div className="flex max-w-[760px] flex-col gap-4">
            <Eyebrow>{h.get.eyebrow}</Eyebrow>
            <h2 className={sectionTitle}>{h.get.title}</h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
            {h.get.items.map((it, i) => (
              <div key={it.title} className="flex flex-col gap-3.5 rounded-lg border-[1.5px] border-ink p-7">
                <span className="font-serif text-[44px] font-black leading-none">{i + 1}</span>
                <h3 className="text-[21px] font-bold leading-tight">{it.title}</h3>
                <p className="text-[15px] text-ink-2">{it.body}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2">
            <Dashboard src={scorecardBoard} label={h.dashboards.scorecard.label} alt={h.dashboards.scorecard.alt} />
            <Dashboard src={evaluationDetailBoard} label={h.dashboards.evaluationDetail.label} alt={h.dashboards.evaluationDetail.alt} />
            <Dashboard src={researchBoard} label={h.dashboards.research.label} alt={h.dashboards.research.alt} />
            <Dashboard src={coverageBoard} label={h.dashboards.coverage.label} alt={h.dashboards.coverage.alt} />
          </div>
          <p className="font-mono text-[12px] text-ink-2">{h.dashboards.note}</p>
        </section>

        {/* Interactive example */}
        <section id="example" className="scroll-mt-4 bg-surface-2">
          <div className={`${container} flex flex-col gap-9 py-24`}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
                <Eyebrow>{h.example.eyebrow}</Eyebrow>
                <h2 className={sectionTitle}>{h.example.title}</h2>
                <p className="max-w-[600px] text-[17px]">{h.example.body}</p>
              </div>
              <p className="rounded-lg border-[1.5px] border-dashed border-ink bg-surface px-2.5 py-1.5 font-mono text-[12px]">{h.example.note}</p>
            </div>
            <ExampleTabs />
            <p className="text-[15px]">
              <Link href={`/r/${DEMO_TOKEN}`} className="font-bold underline underline-offset-4 hover:text-ink-2">
                {h.example.fullLink} →
              </Link>
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={`${container} flex scroll-mt-4 flex-col gap-10 pt-[104px] pb-14`}>
          <div className="flex flex-wrap items-center gap-10">
            <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-4">
              <Eyebrow>{h.how.eyebrow}</Eyebrow>
              <h2 className={sectionTitle}>{h.how.title}</h2>
            </div>
            <Image
              src={dropperSamples}
              alt="A product developer adding drops to a sample beside botanicals, blood oranges and a laptop"
              placeholder="blur"
              sizes="(min-width: 1000px) 560px, 100vw"
              className="h-80 w-full min-w-0 flex-[1_1_440px] rotate-1 rounded-lg border-[1.5px] border-ink object-cover"
            />
          </div>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-[1.5px] overflow-hidden rounded-lg border-[1.5px] border-ink bg-ink">
            {h.how.steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2.5 bg-bg px-6 py-7">
                <span className="font-mono text-[13px] font-bold">0{i + 1}</span>
                <h3 className="text-[18px] font-bold">{s.title}</h3>
                <p className="text-[15px] text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className={`${container} flex flex-wrap items-start gap-12 pt-14 pb-[104px]`}>
          <Image
            src={swatches}
            alt="Color swatches clipped along a sunny stone windowsill beside an open notebook"
            placeholder="blur"
            sizes="(min-width: 1000px) 400px, 100vw"
            className="h-[min(520px,70vw)] w-full min-w-0 flex-[1_1_320px] rounded-lg object-cover"
          />
          <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-8">
            <h2 className="font-serif text-[clamp(34px,3.8vw,52px)] font-black leading-none tracking-[-0.03em]">{h.faq.title}</h2>
            <div className="border-t-[1.5px] border-ink">
              {h.faq.items.map((f, i) => (
                <details key={f.q} open={i === 0} className="group border-b-[1.5px] border-ink py-5">
                  <summary className="flex cursor-pointer list-none justify-between gap-4 text-[18px] font-bold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden className="mr-1 shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-[720px] text-[16px] text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className={`${container} pb-[72px]`}>
          <div className="flex flex-wrap items-stretch gap-4">
            <Image
              src={studioWindow}
              alt="A sunlit studio table by a garden window with idea cards, blood oranges and an espresso"
              placeholder="blur"
              sizes="(min-width: 1000px) 400px, 100vw"
              className="min-h-[340px] w-full min-w-0 flex-[1_1_360px] rounded-lg object-cover"
            />
            <div className="flex min-w-0 flex-[999_1_520px] flex-wrap items-end justify-between gap-8 rounded-lg bg-brand p-[clamp(28px,5vw,64px)]">
              <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
                <h2 className="font-serif text-[clamp(36px,4.6vw,64px)] font-black leading-[0.98] tracking-[-0.03em] text-balance">{h.closing.title}</h2>
                <p className="max-w-[560px] text-[18px]">{h.closing.body}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={CONTACT}
                  className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-ink bg-ink px-[26px] py-4 text-[16px] font-bold text-bg transition-transform hover:-rotate-1"
                >
                  {h.cta} <Icon name="arrowRight" size={16} />
                </Link>
                <Link
                  href={DEMO}
                  className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-ink bg-surface px-[26px] py-4 text-[16px] font-bold text-ink transition-transform hover:-rotate-1"
                >
                  {h.demo}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className={`${container} pb-10`}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] border-ink pt-6">
            <Logo tagline={false} />
            <span className="text-[14px] text-ink-2">{h.footer}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
