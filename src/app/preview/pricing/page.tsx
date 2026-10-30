import Link from "next/link";
import { plans } from "@/content/plans";

const FAQ = [
  {
    q: "What is one brief?",
    a: "One food or drink idea, researched and assessed: market, consumers, feasibility and competitors, with sources.",
  },
  { q: "Can I cancel?", a: "Yes, any time from your account. Your results stay available." },
  {
    q: "What if I use all my briefs?",
    a: "Buy single briefs, or move to a bigger plan. Unused briefs reset each month.",
  },
];

export default function PricingPreview() {
  return (
    <main className="mx-auto max-w-[1180px] px-4 pt-14 pb-20 sm:px-6">
      <p className="eyebrow text-ink-2">Pricing</p>
      <h1 className="mt-3 max-w-[760px] font-serif text-[clamp(38px,5vw,56px)] font-black leading-[1.02] tracking-[-0.03em] text-balance">
        Research every idea before you invest in it.
      </h1>
      <p className="mt-4 max-w-[640px] text-[18px] text-ink-2">
        Start with one free brief. Then choose a plan that fits how many ideas your team tests each month.
      </p>

      <div className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const featured = "featured" in p && p.featured;
          return (
            <div
              key={p.id}
              className={`flex flex-col gap-3.5 rounded-2xl p-7 ${featured ? "border-2 border-brand bg-[#fff6f4]" : "border border-line bg-white"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-2">{p.name}</span>
                {featured && <span className="rounded-full bg-brand px-2.5 py-1 text-[12px] font-bold">Most popular</span>}
              </div>
              <div>
                <span className="font-serif text-[44px] font-black">{p.price}</span>
                {p.per && <span className="text-[15px] text-ink-2"> {p.per}</span>}
              </div>
              <p className="text-[15px] text-ink-2">{p.pitch}</p>
              <ul className="list-disc pl-[18px] text-[15px] leading-[1.9]">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className={`mt-auto h-12 rounded-lg border-[1.5px] border-ink text-[15px] font-bold text-ink ${featured ? "bg-brand" : "bg-white"}`}
              >
                {p.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface-2 px-7 py-6">
        <div>
          <p className="font-serif text-[22px] font-black">Enterprise</p>
          <p className="mt-1 text-[15px] text-ink-2">Agreed volume, a yearly contract and your own evaluation criteria.</p>
        </div>
        <Link href="/contact" className="rounded-lg border-[1.5px] border-ink bg-white px-4 py-3 font-bold">
          Talk to us
        </Link>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-7 md:grid-cols-3">
        {FAQ.map((f) => (
          <div key={f.q}>
            <h2 className="text-[17px] font-bold">{f.q}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{f.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
