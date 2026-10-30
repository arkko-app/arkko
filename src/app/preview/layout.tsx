import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui";

/** Design previews of subscriptions, for discussion with Pedro. Not linked from the site and not indexed. */
export const metadata: Metadata = {
  title: "Preview — Arkko",
  robots: { index: false, follow: false },
};

const SCREENS = [
  { href: "/preview/pricing", label: "Pricing" },
  { href: "/preview/account", label: "My briefs" },
  { href: "/preview/dashboard", label: "Owner dashboard" },
];

export default function PreviewLayout({ children }: LayoutProps<"/preview">) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="bg-ink px-4 py-2.5 text-center text-[13px] text-bg">
        Preview for discussion: prices and numbers are not final, and nothing here charges anyone.
      </div>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
          <Logo tagline={false} />
          <nav className="flex flex-wrap gap-2" aria-label="Preview screens">
            {SCREENS.map((s) => (
              <Link key={s.href} href={s.href} className="rounded-full px-3 py-1.5 text-[14px] font-semibold hover:bg-surface-2">
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
