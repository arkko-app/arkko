import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getByResultsToken } from "@/lib/db";
import { buildShowcaseData, withResolvedReviewImages } from "@/lib/showcase";
import { currentStage } from "@/lib/stage";
import { Showcase } from "@/components/showcase/Showcase";
import { StatusView } from "@/components/status/StatusView";
import { PageSkeleton } from "@/components/PageSkeleton";

export const metadata: Metadata = {
  title: "Your results — Arkko",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function Results({ params, searchParams }: PageProps<"/r/[token]">) {
  await connection();
  const { token } = await params;
  const { v } = await searchParams;
  const rec = await getByResultsToken(token);
  if (!rec || rec.status === "draft") notFound();
  // Until results exist, and while an edited brief is researched again, the results link shows the request's status.
  if (currentStage(rec).phase !== "results") return <StatusView rec={withResolvedReviewImages(rec)} token={token} />;
  return <Showcase data={buildShowcaseData(rec, Number(v) || undefined)} />;
}

export default function Page({ params, searchParams }: PageProps<"/r/[token]">) {
  return (
    <Suspense fallback={<PageSkeleton variant="request" />}>
      <Results params={params} searchParams={searchParams} />
    </Suspense>
  );
}
