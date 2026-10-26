import { Logo } from "./ui";

const block = "animate-pulse bg-surface-2";
const bar = `${block} rounded-md`;

/**
 * Placeholder shown while a page loads: the same frame as the brief and request pages
 * (sidebar, header, content), with soft blocks where the content will appear.
 */
export function PageSkeleton({ variant }: { variant: "brief" | "request" }) {
  const width = variant === "brief" ? "max-w-[820px]" : "max-w-[1080px]";
  return (
    <div className="flex min-h-screen bg-bg">
      <span role="status" className="sr-only">
        Loading…
      </span>

      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-line px-4 py-7 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <div className="mt-10 space-y-4 px-3" aria-hidden>
          {["w-3/4", "w-2/3", "w-1/2"].map((w) => (
            <div key={w} className={`${bar} h-5 ${w}`} />
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1" aria-hidden>
        <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
          <div className={`mx-auto flex h-16 ${width} items-center gap-3 px-4 sm:px-8`}>
            <div className="lg:hidden">
              <Logo tagline={false} />
            </div>
            <div className={`${bar} hidden h-4 w-40 lg:block`} />
          </div>
        </header>

        <main className={`mx-auto ${width} px-4 pb-20 pt-8 sm:px-8 sm:pt-12`}>
          <div className={`${bar} h-3 w-28`} />
          <div className={`${bar} mt-4 h-10 w-4/5 sm:h-12`} />
          <div className={`${bar} mt-4 h-4 w-3/5`} />

          {variant === "brief" ? (
            <div className="mt-8 space-y-7 rounded-2xl border border-line bg-surface p-5 sm:p-7">
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <div className={`${bar} h-4 w-1/2`} />
                  <div className={`${block} mt-3 ${i % 2 ? "h-20" : "h-11"} w-full rounded-lg`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-7">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`${block} size-6 shrink-0 rounded-full`} />
                    <div className={`${bar} h-4 ${i % 2 ? "w-1/2" : "w-2/3"}`} />
                  </div>
                ))}
              </div>
              <div className="space-y-3 self-start rounded-2xl border border-line bg-surface p-5">
                <div className={`${bar} h-4 w-2/3`} />
                <div className={`${block} h-10 w-full rounded-lg`} />
                <div className={`${bar} h-4 w-1/2`} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
