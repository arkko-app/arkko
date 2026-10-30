import Link from "next/link";

/** Example briefs: the preview shows the layout, not real customers. */
const BRIEFS = [
  { idea: "Mint tea beverage", line: "Calm focus sparkling drink", ready: true },
  { idea: "Sparkling botanical can", line: "Afternoon lift without the energy drink hit", ready: true },
  { idea: "Iced tea for gym-goers", line: "Low-sugar recovery tea", ready: false },
];

const th = "px-6 py-3.5 text-left font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-2";

export default function AccountPreview() {
  return (
    <main className="mx-auto max-w-[1180px] px-4 pt-12 pb-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow text-ink-2">Your workspace</p>
          <h1 className="mt-2.5 font-serif text-[44px] font-black leading-none tracking-[-0.03em]">My briefs</h1>
        </div>
        <Link href="/start" className="rounded-lg border-[1.5px] border-ink bg-brand px-5 py-3.5 text-[15px] font-bold">
          + Start a new brief
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white px-7 py-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-2">Starter plan</span>
            <Link href="/preview/pricing" className="text-[14px] font-semibold underline underline-offset-4">
              Change plan
            </Link>
          </div>
          <p className="mt-3.5 text-[16px]">
            <span className="font-serif text-[34px] font-black">3</span> of 5 briefs used this month
          </p>
          <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label="3 of 5 briefs used">
            <div className="h-full w-3/5 rounded-full bg-brand" />
          </div>
          <p className="mt-2.5 text-[14px] text-ink-2">2 briefs left this month</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-brand-soft px-7 py-6">
          <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-2">Every brief includes</span>
          <p className="text-[16px] leading-[1.7]">Sourced findings and charts · Competitor table · Risks and the next test · PDF to share</p>
        </div>
      </div>

      <h2 className="mt-11 mb-3.5 font-serif text-[24px] font-black">All briefs</h2>
      <div className="relative overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-line">
              <th className={th}>Idea</th>
              <th className={th}>Status</th>
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {BRIEFS.map((b) => (
              <tr key={b.idea} className="border-b border-line last:border-0">
                <td className="px-6 py-4">
                  <div className="font-semibold">{b.idea}</div>
                  <div className="text-[13px] text-muted">{b.line}</div>
                </td>
                <td className="px-6 py-4">
                  {b.ready ? (
                    <span className="inline-block whitespace-nowrap rounded-full bg-brand-soft px-3 py-1.5 text-[13px] font-semibold">Results ready</span>
                  ) : (
                    <span className="inline-block whitespace-nowrap rounded-full border border-accent-line bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent-text">
                      Researching · about 5 min
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap font-semibold">
                  {b.ready ? (
                    <>
                      <span className="mr-4 underline underline-offset-4">Open results</span>
                      <span className="underline underline-offset-4">Download PDF</span>
                    </>
                  ) : (
                    <span className="underline underline-offset-4">View progress</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface-2 px-7 py-5">
        <p className="text-[15px]">Need more briefs this month? Buy single briefs for $49, or move to Team for 20 a month.</p>
        <Link href="/preview/pricing" className="rounded-lg border-[1.5px] border-ink bg-white px-4 py-3 font-bold">
          See plans
        </Link>
      </div>
    </main>
  );
}
