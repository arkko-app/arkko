import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { config } from "@/lib/config";
import { IntakeFlow } from "@/components/intake/IntakeFlow";
import { PageSkeleton } from "@/components/PageSkeleton";

export const metadata: Metadata = { title: "Start a brief — Arkko" };

async function Intake() {
  // Read at request time so adding the API key switches the chat to Claude without a rebuild.
  await connection();
  return <IntakeFlow aiChat={config.chatEnabled} />;
}

export default function StartPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="brief" />}>
      <Intake />
    </Suspense>
  );
}
