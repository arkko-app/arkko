import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { site } from "@/content/site";

export function Logo({ tagline = true, href = "/" }: { tagline?: boolean; href?: string | null }) {
  const inner = (
    <>
      <span className="font-serif text-[26px] font-bold tracking-tight text-ink">{site.name}</span>
      {tagline && (
        <span className="mt-1.5 block max-w-[110px] text-[11px] leading-snug text-ink-2">{site.tagline}</span>
      )}
    </>
  );
  return href ? (
    <Link href={href} className="block leading-none">{inner}</Link>
  ) : (
    <span className="block leading-none">{inner}</span>
  );
}

type BtnProps = { variant?: "primary" | "secondary" | "ghost"; icon?: IconName; children: ReactNode };

const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
  primary: "bg-brand text-brand-ink hover:bg-brand-hover shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong shadow-[0_1px_0_rgba(0,0,0,0.03)]",
  ghost: "text-brand-text hover:bg-brand-soft",
};

export function Button({ variant = "primary", icon, children, className = "", ...rest }: BtnProps & ComponentProps<"button">) {
  return (
    <button className={`${btn.base} ${btn[variant]} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", icon, children, className = "", ...rest }: BtnProps & ComponentProps<typeof Link>) {
  return (
    <Link className={`${btn.base} ${btn[variant]} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </Link>
  );
}

export function Card({ className = "", children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={`rounded-2xl border border-line bg-surface ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Chip({ tone = "neutral", children }: { tone?: "neutral" | "outline" | "dashed" | "brand" | "accent"; children: ReactNode }) {
  const tones = {
    neutral: "bg-chip text-ink-2 border-transparent",
    outline: "bg-surface text-ink-2 border-line-strong",
    dashed: "bg-surface text-ink-2 border-line-strong border-dashed",
    brand: "bg-brand-soft text-brand-text border-transparent",
    accent: "bg-accent-soft text-accent-text border-accent-line",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      aria-hidden
    />
  );
}
