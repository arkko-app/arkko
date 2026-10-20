"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readSavedRequests, type SavedRequest } from "../status/actions";
import { Icon } from "../icons";

/** "Pick up where you left off" for requests opened in this browser. */
export function ContinueRequest() {
  const [req, setReq] = useState<SavedRequest | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage after mount
  useEffect(() => setReq(readSavedRequests()[0] ?? null), []);
  if (!req) return null;
  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
      <Link
        href={req.path}
        className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm hover:border-line-strong"
      >
        <span className="size-2 rounded-full bg-accent-dot" />
        <span className="flex-1 text-ink-2">
          Your request for <strong className="text-ink">{req.brand}</strong>
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-text">
          View status <Icon name="arrowRight" size={14} />
        </span>
      </Link>
    </div>
  );
}
