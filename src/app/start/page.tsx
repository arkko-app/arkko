import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { config } from "@/lib/config";
import { IntakeFlow } from "@/components/intake/IntakeFlow";

export const metadata: Metadata = { title: "Start a brief — Arkko" };

async function Intake() {
  // Read at request time so adding the API key switches the chat to Claude without a rebuild.
  await connection();
  return <IntakeFlow aiChat={config.chatEnabled} />;
}

export default function StartPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted">Loading…</div>}>
      <Intake />
    </Suspense>
  );
}
