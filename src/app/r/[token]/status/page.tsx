import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getByResultsToken } from "@/lib/db";
import { withResolvedReviewImages } from "@/lib/showcase";
import { StatusView } from "@/components/status/StatusView";
import { PageSkeleton } from "@/components/PageSkeleton";

export const metadata: Metadata = {
  title: "Your request — Arkko",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function Status({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const rec = await getByResultsToken(token);
  if (!rec || rec.status === "draft") notFound();
  return <StatusView rec={withResolvedReviewImages(rec)} token={token} />;
}

export default function Page({ params }: PageProps<"/r/[token]/status">) {
  return (
    <Suspense fallback={<PageSkeleton variant="request" />}>
      <Status params={params} />
    </Suspense>
  );
}
