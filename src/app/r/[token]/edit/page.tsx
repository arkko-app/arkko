import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getByResultsToken } from "@/lib/db";
import { canRevise } from "@/lib/revise";
import { Logo } from "@/components/ui";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ReviseBrief } from "@/components/status/ReviseBrief";

export const metadata: Metadata = {
  title: "Edit your brief — Arkko",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function Edit({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const rec = await getByResultsToken(token);
  if (!rec || rec.status === "draft") notFound();
  const editable = canRevise(rec);

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-[820px] items-center justify-between gap-3 px-4 sm:px-8">
          <Logo tagline={false} />
          <Link href={`/r/${token}`} className="text-[14px] font-semibold text-ink underline underline-offset-4">
            Back to results
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[820px] px-4 pb-20 pt-10 sm:px-8">
        <div className="eyebrow text-brand-text">{rec.answers.brand ?? "Your brief"}</div>
        <h1 className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink sm:text-[44px]">
          Edit your brief
        </h1>
        {editable ? (
          <>
            <p className="mt-2 mb-8 text-[16px] text-ink-2">Change what you need. Everything else stays as it is.</p>
            <ReviseBrief token={token} answers={rec.answers} />
          </>
        ) : (
          <p className="mt-4 rounded-2xl border border-line bg-surface p-6 text-[16px] text-ink-2">
            This brief can’t be edited now: it has already been edited, or it is being researched.{" "}
            <Link href={`/r/${token}/status`} className="font-semibold text-ink underline underline-offset-4">
              See its status
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}

export default function Page({ params }: PageProps<"/r/[token]/edit">) {
  return (
    <Suspense fallback={<PageSkeleton variant="brief" />}>
      <Edit params={params} />
    </Suspense>
  );
}
