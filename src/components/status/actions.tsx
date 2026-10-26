"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReviewStage } from "@/lib/types";
import { Icon } from "../icons";
import { Button, Spinner } from "../ui";

const SAVED_KEY = "arkko:requests";

export interface SavedRequest {
  path: string;
  brand: string;
  at: string;
}

/** Remember requests this browser has opened, so the home page can link back to them. */
export function rememberRequest(entry: SavedRequest) {
  try {
    const list: SavedRequest[] = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    const next = [entry, ...list.filter((r) => r.path !== entry.path)].slice(0, 5);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {}
}

export function readSavedRequests(): SavedRequest[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function RememberRequest({ path, brand }: { path: string; brand: string }) {
  useEffect(() => rememberRequest({ path, brand, at: new Date().toISOString() }), [path, brand]);
  return null;
}

/** Re-render from the server while Otto is working, so new versions appear without a reload. */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

/** While a brief waits to be picked up, ask the server once a minute whether the engine needs starting again. */
export function RestartIfStuck({ token }: { token: string }) {
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === "visible")
        fetch(`/api/status/${token}/restart`, { method: "POST" }).catch(() => {});
    };
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [token]);
  return null;
}

export function CopyLink({ path }: { path: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- origin is only known in the browser
  useEffect(() => setUrl(`${window.location.origin}${path}`), [path]);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-bg/60 p-1.5 pl-3">
      <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">{url}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-surface px-2.5 text-xs font-semibold text-ink shadow-sm ring-1 ring-line hover:ring-line-strong"
      >
        <Icon name={copied ? "check" : "file"} size={13} />
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

export function ReviewDecision({ token, reviewId, stage }: { token: string; reviewId: string; stage: ReviewStage }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState<"approved" | "changes_requested" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(decision: "approved" | "changes_requested") {
    if (decision === "changes_requested" && feedback.trim().length < 3) {
      setError("Tell us what you'd like changed.");
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch(`/api/status/${token}/reviews/${reviewId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, feedback: feedback.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "We couldn't save your response. Please try again.");
        if (res.status === 409) router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't reach the server, so your response wasn't saved. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="border-t border-line bg-surface-2/60 p-5 sm:p-6">
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          <Icon name="alert" size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {mode === "idle" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-ink-2">
            {stage === "idea"
              ? "Approve it and we'll develop it into a full concept, or tell us what to change."
              : "Approve it and we'll start the research, or tell us what to change."}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMode("changes")} disabled={!!busy}>
              Request changes
            </Button>
            <Button onClick={() => send("approved")} disabled={!!busy}>
              {busy === "approved" ? <Spinner /> : <Icon name="check" size={15} />} Approve {stage}
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send("changes_requested");
          }}
        >
          <label htmlFor="feedback" className="block text-[15px] font-medium text-ink">
            What should change?
          </label>
          <p className="mt-0.5 text-sm text-muted">Be as specific as you like. Otto will send a new version here.</p>
          <textarea
            id="feedback"
            rows={4}
            autoFocus
            maxLength={5000}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mt-3 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink focus:border-brand focus:outline-none"
            placeholder="e.g. Less about caffeine, more about the moment in the day."
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setMode("idle")} disabled={!!busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={!!busy}>
              {busy ? <Spinner /> : null} Send feedback
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function EmailResults({
  token,
  email,
  sent,
  resultsReady,
}: {
  token: string;
  email?: string;
  sent: boolean;
  resultsReady: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!email);
  const [value, setValue] = useState(email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <p className="flex items-start gap-2 text-sm text-ink-2">
        <Icon name="check" size={15} className="mt-0.5 shrink-0 text-brand-text" />
        <span>
          Results emailed to <strong className="text-ink">{email}</strong>.
        </span>
      </p>
    );
  }

  if (email && !editing) {
    return (
      <div className="text-sm text-ink-2">
        <p className="flex items-start gap-2">
          <Icon name="mail" size={15} className="mt-0.5 shrink-0 text-brand-text" />
          <span>
            {resultsReady ? "Sending the results to " : "We'll email the results to "}
            <strong className="text-ink">{email}</strong>
            {resultsReady ? " shortly." : " when they're ready."}
          </span>
        </p>
        <button type="button" onClick={() => setEditing(true)} className="mt-2 text-[13px] font-semibold text-brand-text hover:underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          setError("Enter a valid email address.");
          return;
        }
        setBusy(true);
        setError(null);
        try {
          const res = await fetch(`/api/status/${token}/email`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: value.trim() }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error ?? "We couldn't save your email. Please try again.");
          setEditing(false);
          router.refresh();
        } catch (err) {
          setError(err instanceof TypeError ? "We couldn't reach the server. Please try again." : (err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="results-email" className="sr-only">
        Email address
      </label>
      <div className="flex gap-2">
        <input
          id="results-email"
          type="email"
          autoComplete="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="you@company.com"
          aria-invalid={!!error}
          className={`min-w-0 flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none ${error ? "border-danger" : "border-line"}`}
        />
        <Button type="submit" disabled={busy} className="h-9 px-3">
          {busy ? <Spinner /> : "Send"}
        </Button>
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      {email && (
        <button type="button" onClick={() => setEditing(false)} className="mt-2 text-[13px] font-semibold text-ink-2 hover:underline">
          Cancel
        </button>
      )}
    </form>
  );
}
