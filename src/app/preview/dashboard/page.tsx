/** Example numbers: the preview shows what Pedro would see once subscriptions are live. */
const STATS = [
  { label: "Briefs this month", value: "42", note: "40 finished · 2 retried automatically" },
  { label: "Paying customers", value: "9", note: "of 18 companies · 9 on the free brief" },
  { label: "Revenue this month", value: "$1,638", note: "7 Starter · 1 Team · 4 single briefs", featured: true },
  { label: "Research cost", value: "$21", note: "about $0.50 per brief" },
];

/** Briefs per week, last 8 weeks; the last 4 are this month. */
const WEEKS = [6, 8, 5, 7, 9, 11, 10, 12];

const PLANS = [
  { name: "Free brief only", count: 9 },
  { name: "Starter", count: 7 },
  { name: "Team", count: 1 },
  { name: "Single briefs", count: 1 },
];

const LATEST = [
  { company: "[Company A]", idea: "Mint tea beverage", plan: "Starter", ready: true, cost: "$0.49" },
  { company: "[Company B]", idea: "Sparkling botanical can", plan: "Free brief", ready: true, cost: "$0.52" },
  { company: "[Company C]", idea: "Iced tea for gym-goers", plan: "Team", ready: false, cost: "—" },
];

const th = "px-5 py-3.5 text-left font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-2";

export default function DashboardPreview() {
  const peak = Math.max(...WEEKS);
  const companies = PLANS.reduce((n, p) => n + p.count, 0);
  return (
    <main className="mx-auto max-w-[1180px] px-4 pt-11 pb-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-ink-2">This month</p>
          <h1 className="mt-2.5 font-serif text-[clamp(32px,4vw,44px)] font-black leading-none tracking-[-0.03em]">
            42 briefs from 18 companies
          </h1>
        </div>
        <span className="rounded-full border border-accent-line bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent-text">
          Example numbers
        </span>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl px-5 py-5 ${"featured" in s ? "border-2 border-brand bg-[#fff6f4]" : "border border-line bg-white"}`}
          >
            <div className="text-[14px] text-ink-2">{s.label}</div>
            <div className="mt-1.5 font-serif text-[36px] font-black">{s.value}</div>
            <div className="text-[13px] text-ink-2">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white px-6 py-5">
          <h2 className="text-[16px] font-bold">Briefs per week</h2>
          <p className="mt-0.5 text-[13px] text-ink-2">Last 8 weeks · red is this month</p>
          <div className="mt-5 flex h-[170px] items-end gap-3.5 border-b border-line px-1" role="img" aria-label={`Briefs per week: ${WEEKS.join(", ")}`}>
            {WEEKS.map((n, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className={`text-[12px] ${i === WEEKS.length - 1 ? "font-bold" : "text-ink-2"}`}>{n}</span>
                <div
                  className={`w-full max-w-6 rounded-t ${i >= WEEKS.length - 4 ? "bg-brand" : "bg-line"}`}
                  style={{ height: `${(n / peak) * 86}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white px-6 py-5">
          <h2 className="text-[16px] font-bold">Customers by plan</h2>
          <p className="mt-0.5 text-[13px] text-ink-2">{companies} companies</p>
          <div className="mt-5 flex flex-col gap-3.5 text-[14px]">
            {PLANS.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-bold">{p.count}</span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(p.count / companies) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mt-10 mb-3.5 font-serif text-[24px] font-black">Latest briefs</h2>
      <div className="relative overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-line">
              <th className={th}>Company</th>
              <th className={th}>Idea</th>
              <th className={th}>Plan</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Research cost</th>
            </tr>
          </thead>
          <tbody>
            {LATEST.map((b) => (
              <tr key={b.idea} className="border-b border-line last:border-0">
                <td className="px-5 py-4 font-semibold">{b.company}</td>
                <td className="px-5 py-4">{b.idea}</td>
                <td className="px-5 py-4">{b.plan}</td>
                <td className="px-5 py-4">
                  {b.ready ? (
                    <span className="inline-block whitespace-nowrap rounded-full bg-brand-soft px-3 py-1.5 text-[13px] font-semibold">Results ready</span>
                  ) : (
                    <span className="inline-block whitespace-nowrap rounded-full border border-accent-line bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent-text">
                      Researching
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">{b.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
