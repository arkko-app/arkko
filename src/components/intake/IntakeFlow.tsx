"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { intakeFields, site } from "@/content/site";
import { Icon, type IconName } from "../icons";
import { Button, Logo, Spinner } from "../ui";
import { CopyLink, readSavedRequests, rememberRequest, type SavedRequest } from "../status/actions";
import { ChatBrief, transcriptOf, type ChatState } from "./ChatBrief";

const STORAGE_KEY = "arkko:intake:v2";
const MAX_IMAGES = 6;
const MAX_BYTES = 4 * 1024 * 1024; // keep in step with uploadRules.maxBytes
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Step = 0 | 1 | 2 | 3;

interface Saved {
  key: string;
  id?: string;
  draftToken?: string;
  answers: Record<string, string>;
  email: string;
  step: Step;
  /** How the brief is given on step 0. Unset until the user picks. */
  mode?: "chat" | "form";
  chat?: ChatState;
  uploaded: { id: string; originalName: string; size: number }[];
  submitted?: SubmitResult;
}

interface SubmitResult {
  id: string;
  status: string;
  email: string | null;
  statusPath: string;
  handoff: { mode: "push" | "pull"; ok: boolean } | null;
}

interface UploadItem {
  localId: string;
  name: string;
  size: number;
  preview?: string;
  progress: number;
  state: "uploading" | "done" | "error";
  error?: string;
  serverId?: string;
  file?: File;
}

const STEPS: { label: string; icon: IconName }[] = [
  { label: "Your brief", icon: "file" },
  { label: "Images", icon: "image" },
  { label: "Submit", icon: "check" },
];

/** With the chat switched off there is nothing to choose: briefs start on the form. */
const CHAT_ON = site.features.chatIntake;
const fresh = (): Saved => ({
  key: crypto.randomUUID(),
  answers: {},
  email: "",
  step: 0,
  uploaded: [],
  mode: CHAT_ON ? undefined : "form",
});

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {}
  return fresh();
}

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function IntakeFlow({ aiChat }: { aiChat: boolean }) {
  const [s, setS] = useState<Saved | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** True when unfinished progress was found: ask before dropping the user back into it. */
  const [resume, setResume] = useState(false);
  const [recent, setRecent] = useState<SavedRequest | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore saved progress so nothing is lost on refresh or while giving an email.
  useEffect(() => {
    let saved = load();
    const started = saved.step > 0 || Object.values(saved.answers).some((v) => v?.trim()) || !!saved.chat?.history.length;
    const sent = !!saved.submitted && saved.step === 3;
    if (sent) {
      // A sent brief is finished: start a new one. The sent one stays reachable from the link on the choice screen.
      saved = fresh();
    } else if (!CHAT_ON) {
      saved = { ...saved, mode: "form" };
    } else if (!started) {
      saved = { ...saved, mode: undefined };
    } else if (saved.step === 0 && !saved.mode) {
      saved = { ...saved, mode: saved.chat?.history.length ? "chat" : "form" };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
    setS(saved);
    setResume(started && !sent);
    setRecent(readSavedRequests()[0] ?? null);
    setUploads(
      saved.uploaded.map((u) => ({ localId: u.id, name: u.originalName, size: u.size, progress: 100, state: "done", serverId: u.id })),
    );
  }, []);

  useEffect(() => {
    if (!s) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...s,
          uploaded: uploads
            .filter((u) => u.state === "done" && u.serverId)
            .map((u) => ({ id: u.serverId!, originalName: u.name, size: u.size })),
        }),
      );
    } catch {}
  }, [s, uploads]);

  const update = useCallback((patch: Partial<Saved>) => setS((prev) => (prev ? { ...prev, ...patch } : prev)), []);

  const goStep = (step: Step) => {
    setError(null);
    update({ step });
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  /** Create the draft on first save, then keep its answers in sync. */
  async function saveDraft(cur: Saved): Promise<Saved> {
    const chatTranscript = cur.chat?.history.length ? transcriptOf(cur.chat) : undefined;
    if (cur.id && cur.draftToken) {
      const res = await fetch(`/api/requests/${cur.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-draft-token": cur.draftToken },
        body: JSON.stringify({ answers: cur.answers, chatTranscript }),
      });
      if (res.ok) return cur;
      if (res.status === 409) throw new Error("This brief was already submitted.");
      if (res.status !== 404) throw new Error("We couldn't save your answers. Please try again.");
      // Draft no longer exists: start a new one below.
      cur = { ...cur, id: undefined, draftToken: undefined, key: crypto.randomUUID() };
      setUploads([]);
    }
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotencyKey: cur.key, answers: cur.answers, chatTranscript }),
    });
    if (!res.ok) throw new Error("We couldn't save your answers. Please try again.");
    const { id, draftToken } = await res.json();
    const next = { ...cur, id, draftToken };
    setS(next);
    return next;
  }

  async function submitBrief(e: React.FormEvent) {
    e.preventDefault();
    if (!s) return;
    const errs: Record<string, string> = {};
    intakeFields.forEach((f) => {
      if (f.required && !s.answers[f.id]?.trim()) errs[f.id] = "Please answer this question.";
    });
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`field-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    await continueWith(s);
  }

  /** Save the brief (from the form or the chat) and move on to images. */
  async function continueWith(cur: Saved) {
    setBusy(true);
    setError(null);
    try {
      await saveDraft(cur);
      goStep(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function upload(item: UploadItem, cur: Saved) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/requests/${cur.id}/images`);
    xhr.setRequestHeader("x-draft-token", cur.draftToken!);
    const set = (patch: Partial<UploadItem>) =>
      setUploads((list) => list.map((u) => (u.localId === item.localId ? { ...u, ...patch } : u)));
    xhr.upload.onprogress = (e) => e.lengthComputable && set({ progress: Math.round((e.loaded / e.total) * 95) });
    xhr.onload = () => {
      let body: { image?: { id: string }; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status === 201 && body.image) set({ state: "done", progress: 100, serverId: body.image.id, file: undefined });
      else set({ state: "error", error: body.error ?? "Upload failed" });
    };
    xhr.onerror = () => set({ state: "error", error: "Connection lost — try again" });
    const form = new FormData();
    form.append("file", item.file!);
    xhr.send(form);
  }

  function addFiles(files: FileList | null) {
    if (!files || !s?.id) return;
    const room = MAX_IMAGES - uploads.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > room) setError(`You can add up to ${MAX_IMAGES} images.`);
    else setError(null);
    const items: UploadItem[] = picked.map((file) => {
      const base = { localId: crypto.randomUUID(), name: file.name, size: file.size, progress: 0, file };
      if (!TYPES.includes(file.type)) return { ...base, state: "error", error: "Use JPEG, PNG, WebP or GIF" };
      if (file.size > MAX_BYTES) return { ...base, state: "error", error: "Larger than 4 MB" };
      return { ...base, state: "uploading", preview: URL.createObjectURL(file) };
    });
    setUploads((list) => [...list, ...items]);
    items.filter((i) => i.state === "uploading").forEach((i) => upload(i, s));
  }

  function retry(item: UploadItem) {
    if (!s || !item.file || !TYPES.includes(item.file.type) || item.file.size > MAX_BYTES) return;
    const next = { ...item, state: "uploading" as const, progress: 0, error: undefined };
    setUploads((list) => list.map((u) => (u.localId === item.localId ? next : u)));
    upload(next, s);
  }

  async function remove(item: UploadItem) {
    setUploads((list) => list.filter((u) => u.localId !== item.localId));
    if (item.serverId && s?.id) {
      await fetch(`/api/requests/${s.id}/images/${item.serverId}`, {
        method: "DELETE",
        headers: { "x-draft-token": s.draftToken! },
      }).catch(() => undefined);
    }
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!s?.id) return;
    if (s.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) {
      setFieldErrors({ email: "Enter a valid email address." });
      document.getElementById("field-email")?.focus();
      return;
    }
    setFieldErrors({});
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${s.id}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-draft-token": s.draftToken! },
        body: JSON.stringify({ email: s.email.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Something went wrong. Your brief is saved — please try again.");
      update({ submitted: body });
      rememberRequest({ path: body.statusPath, brand: s.answers.brand ?? "Your brief", at: new Date().toISOString() });
      if (body.status !== "handoff_failed") goStep(3);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "We couldn't reach the server, so we can't confirm your brief was received. It's saved here — try again."
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function retryHandoff() {
    if (!s?.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${s.id}/handoff`, {
        method: "POST",
        headers: { "x-draft-token": s.draftToken! },
      });
      const body = await res.json();
      update({ submitted: body });
      if (body.status !== "handoff_failed") goStep(3);
    } catch {
      setError("Still can't connect. Your brief is saved — try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setUploads([]);
    setS(fresh());
    setError(null);
    setResume(false);
    setRecent(readSavedRequests()[0] ?? null);
  }

  if (!s) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        <Spinner />
      </div>
    );
  }

  const uploading = uploads.some((u) => u.state === "uploading");
  const failed = uploads.filter((u) => u.state === "error").length;
  const handoffFailed = s.submitted?.status === "handoff_failed";
  const view = resume ? "resume" : s.step;
  const where =
    s.step === 0 ? (s.mode === "chat" ? "You were chatting with Arkko." : "You were filling in the form.")
    : s.step === 1 ? "Your brief is saved. You were adding images."
    : "Your brief is saved and ready to submit.";

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-line px-4 py-7 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-10 space-y-1" aria-label="Progress">
          {STEPS.map((st, i) => {
            const on = s.step === i;
            const done = s.step > i;
            return (
              <div
                key={st.label}
                aria-current={on ? "step" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] ${
                  on ? "bg-brand-soft font-semibold text-brand-text" : done ? "text-ink" : "text-muted"
                }`}
              >
                <Icon name={done ? "check" : st.icon} size={15} />
                {st.label}
              </div>
            );
          })}
        </nav>
        <p className="mt-auto px-2 text-xs leading-relaxed text-muted">
          Your answers are saved in this browser as you go.
        </p>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[820px] items-center gap-3 px-4 sm:px-8">
            <div className="lg:hidden">
              <Logo tagline={false} />
            </div>
            <div className="hidden flex-1 items-center gap-2 text-[13px] lg:flex">
              <span className="font-semibold tracking-wide text-ink">NEW BRIEF</span>
              <span className="text-muted">/</span>
              <span className="text-ink-2">{s.step < 3 ? STEPS[s.step].label : "Received"}</span>
            </div>
            <div className="ml-auto text-[13px] text-muted">{s.step < 3 && `Step ${s.step + 1} of 3`}</div>
          </div>
        </header>

        <main className="mx-auto max-w-[820px] px-4 pb-20 pt-8 sm:px-8 sm:pt-12">
          {error && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {view === "resume" && (
            <div>
              <div className="eyebrow text-brand-text">Welcome back</div>
              <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink outline-none sm:text-[44px]">
                Pick up where you left off?
              </h1>
              <div className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text">
                    <Icon name={s.mode === "chat" && s.step === 0 ? "chat" : "file"} size={20} />
                  </span>
                  <div>
                    <div className="font-serif text-[22px] font-semibold text-ink">
                      {s.answers.brand?.trim() ? <>Your brief for {s.answers.brand}</> : "Your unfinished brief"}
                    </div>
                    <p className="mt-1 text-[15px] text-ink-2">{where}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="button" onClick={() => setResume(false)}>
                    Continue <Icon name="arrowRight" size={15} />
                  </Button>
                  <Button type="button" variant="secondary" onClick={startOver}>
                    Start a new brief
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === 0 && !s.mode && (
            <div>
              <div className="eyebrow text-brand-text">Step 1 · Your brief</div>
              <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink outline-none sm:text-[44px]">
                {site.intake.chooseTitle}
              </h1>
              <p className="mt-2 text-[16px] text-ink-2">{site.intake.chooseBody}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {([
                  ["chat", "chat", site.intake.chat],
                  ["form", "file", site.intake.form],
                ] as const).map(([mode, icon, copy]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update({ mode })}
                    className="group flex flex-col items-start rounded-2xl border border-line bg-surface p-6 text-left transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_24px_-12px_rgba(31,81,72,0.35)]"
                  >
                    <span className={`grid size-11 place-items-center rounded-xl ${mode === "chat" ? "bg-brand text-brand-ink" : "bg-brand-soft text-brand-text"}`}>
                      <Icon name={icon} size={20} />
                    </span>
                    <span className="mt-5 font-serif text-[22px] font-semibold text-ink">{copy.label}</span>
                    <span className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{copy.body}</span>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-text">
                      Start <Icon name="arrowRight" size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>
              {recent && (
                <Link
                  href={recent.path}
                  className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm hover:border-line-strong"
                >
                  <span className="size-2 rounded-full bg-accent-dot" />
                  <span className="flex-1 text-ink-2">
                    Already sent a brief for <strong className="text-ink">{recent.brand}</strong>?
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand-text">
                    View its progress <Icon name="arrowRight" size={14} />
                  </span>
                </Link>
              )}
            </div>
          )}

          {view === 0 && s.mode === "chat" && (
            <div>
              <div className="eyebrow text-brand-text">Step 1 · Your brief</div>
              <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink outline-none sm:text-[44px]">
                Tell Arkko what you want to grow.
              </h1>
              <p className="mt-2 text-[16px] text-ink-2">Answer in your own words. You’ll check the brief before anything is sent.</p>
              <ChatBrief
                chat={s.chat ?? { history: [] }}
                ai={aiChat}
                busy={busy}
                onChange={(chat) => update({ chat })}
                onConfirm={(answers) => {
                  update({ answers });
                  continueWith({ ...s, answers });
                }}
                onUseForm={(answers) => update({ mode: "form", answers: answers ?? s.answers })}
              />
            </div>
          )}

          {view === 0 && s.mode === "form" && (
            <form onSubmit={submitBrief} noValidate>
              <div className="eyebrow text-brand-text">Step 1 · Your brief</div>
              <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink outline-none sm:text-[44px]">
                Tell us what you want to grow.
              </h1>
              <p className="mt-2 text-[16px] text-ink-2">Plain language is perfect. You’ll check everything before it’s sent.</p>
              <div className="mt-8 space-y-6 rounded-2xl border border-line bg-surface p-5 sm:p-7">
                {intakeFields.map((f) => {
                  const err = fieldErrors[f.id];
                  const props = {
                    id: `field-${f.id}`,
                    value: s.answers[f.id] ?? "",
                    maxLength: f.maxLength,
                    placeholder: f.placeholder,
                    "aria-invalid": !!err,
                    "aria-describedby": err ? `err-${f.id}` : f.help ? `help-${f.id}` : undefined,
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      update({ answers: { ...s.answers, [f.id]: e.target.value } }),
                    className: `w-full rounded-lg border bg-bg/40 px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 focus:border-brand focus:bg-surface focus:outline-none ${
                      err ? "border-danger" : "border-line"
                    }`,
                  };
                  return (
                    <div key={f.id}>
                      <label htmlFor={props.id} className="block text-[15px] font-medium text-ink">
                        {f.label} {f.required ? <span className="text-danger">*</span> : <span className="text-sm font-normal text-muted">(optional)</span>}
                      </label>
                      {f.help && <p id={`help-${f.id}`} className="mt-0.5 text-sm text-muted">{f.help}</p>}
                      <div className="mt-2">
                        {f.type === "textarea" ? <textarea rows={3} {...props} /> : <input type="text" {...props} />}
                      </div>
                      {err && <p id={`err-${f.id}`} className="mt-1.5 text-sm text-danger">{err}</p>}
                    </div>
                  );
                })}
              </div>
              <div className={`mt-6 flex items-center gap-3 ${CHAT_ON ? "justify-between" : "justify-end"}`}>
                {CHAT_ON && (
                  <Button type="button" variant="ghost" onClick={() => update({ mode: "chat" })}>
                    <Icon name="chat" size={15} /> Chat instead
                  </Button>
                )}
                <Button type="submit" disabled={busy}>
                  {busy ? <Spinner /> : null} Continue <Icon name="arrowRight" size={15} />
                </Button>
              </div>
            </form>
          )}

          {view === 1 && (
            <div>
              <div className="eyebrow text-brand-text">Step 2 · Images</div>
              <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink outline-none sm:text-[44px]">
                Add anything visual.
              </h1>
              <p className="mt-2 text-[16px] text-ink-2">
                Optional. Packaging, moodboards, shelf photos, sketches. Up to {MAX_IMAGES} images, 4 MB each (JPEG, PNG, WebP, GIF).
              </p>

              <div
                className="mt-8 rounded-2xl border-2 border-dashed border-line-strong bg-surface p-8 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
              >
                <span className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-text">
                  <Icon name="upload" size={20} />
                </span>
                <p className="mt-3 text-[15px] text-ink">Drag images here, or</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploads.length >= MAX_IMAGES}
                >
                  Choose files
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept={TYPES.join(",")}
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {uploads.length > 0 && (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {uploads.map((u) => (
                    <li key={u.localId} className={`flex items-center gap-3 rounded-xl border bg-surface p-3 ${u.state === "error" ? "border-danger/40" : "border-line"}`}>
                      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-muted">
                        {u.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.preview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Icon name="image" size={18} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{u.name}</div>
                        {u.state === "uploading" && (
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={u.progress} aria-label={`Uploading ${u.name}`}>
                            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${u.progress}%` }} />
                          </div>
                        )}
                        {u.state === "done" && <div className="mt-0.5 flex items-center gap-1 text-xs text-brand-text"><Icon name="check" size={12} /> Uploaded · {kb(u.size)}</div>}
                        {u.state === "error" && (
                          <div className="mt-0.5 text-xs text-danger">
                            {u.error}
                            {u.file && TYPES.includes(u.file.type) && u.file.size <= MAX_BYTES && (
                              <button type="button" onClick={() => retry(u)} className="ml-2 font-semibold underline">Retry</button>
                            )}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => remove(u)} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label={`Remove ${u.name}`}>
                        <Icon name="x" size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" onClick={() => goStep(0)}>
                  <Icon name="arrowLeft" size={15} /> Back
                </Button>
                <div className="flex items-center gap-3">
                  {failed > 0 && <span className="text-sm text-danger">Retry or remove {failed} failed image{failed > 1 ? "s" : ""}</span>}
                  <Button type="button" onClick={() => goStep(2)} disabled={uploading || failed > 0}>
                    {uploading ? <><Spinner /> Uploading…</> : uploads.length ? "Continue" : "Skip images"} {!uploading && <Icon name="arrowRight" size={15} />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === 2 && (
            <form onSubmit={submitRequest} noValidate>
              <div className="eyebrow text-brand-text">Step 3 · Submit</div>
              <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink outline-none sm:text-[44px]">
                Ready to send?
              </h1>
              <p className="mt-2 text-[16px] text-ink-2">
                Once you submit, the research team starts right away and your brief can no longer be changed. You’ll get a link to follow the research and see your results.
              </p>

              <div className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-7">
                <div className="rounded-xl bg-surface-2 p-4 text-sm text-ink-2">
                  <div className="font-medium text-ink">You’re sending</div>
                  <ul className="mt-2 space-y-1">
                    <li>· {Object.keys(s.answers).filter((k) => s.answers[k]?.trim()).length} answers about <strong className="text-ink">{s.answers.brand || "your brand"}</strong></li>
                    <li>· {uploads.filter((u) => u.state === "done").length} image{uploads.filter((u) => u.state === "done").length === 1 ? "" : "s"}</li>
                  </ul>
                </div>

                <label htmlFor="field-email" className="mt-6 block text-[15px] font-medium text-ink">
                  Email me the results <span className="text-sm font-normal text-muted">(optional)</span>
                </label>
                <p className="mt-0.5 text-sm text-muted">Recommended. Your results live at a private link, and this way it can’t get lost. We’ll only use it to send you that link.</p>
                <input
                  id="field-email"
                  type="email"
                  autoComplete="email"
                  value={s.email}
                  onChange={(e) => update({ email: e.target.value })}
                  disabled={busy || handoffFailed}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "err-email" : undefined}
                  className={`mt-3 w-full rounded-lg border bg-bg/40 px-3.5 py-2.5 text-[15px] text-ink focus:border-brand focus:bg-surface focus:outline-none ${fieldErrors.email ? "border-danger" : "border-line"}`}
                  placeholder="you@company.com"
                />
                {fieldErrors.email && <p id="err-email" className="mt-1.5 text-sm text-danger">{fieldErrors.email}</p>}

              </div>

              {handoffFailed ? (
                <div role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger-soft p-5">
                  <div className="flex items-center gap-2 font-semibold text-danger"><Icon name="alert" size={16} /> Your brief is saved, but we couldn’t pass it on yet.</div>
                  <p className="mt-1 text-sm text-ink-2">Nothing is lost. Try again now. You won’t create a duplicate.</p>
                  <Button type="button" className="mt-4" onClick={retryHandoff} disabled={busy}>
                    {busy ? <Spinner /> : <Icon name="refresh" size={15} />} Try again
                  </Button>
                </div>
              ) : (
                <div className="mt-6 flex items-center justify-between gap-3">
                  <Button type="button" variant="ghost" onClick={() => goStep(1)} disabled={busy}>
                    <Icon name="arrowLeft" size={15} /> Back
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? <><Spinner /> Submitting…</> : <>Submit brief <Icon name="arrowRight" size={15} /></>}
                  </Button>
                </div>
              )}
            </form>
          )}

          {view === 3 && s.submitted && <Confirmation s={s} onNew={startOver} />}
        </main>
      </div>
    </div>
  );
}

function Confirmation({ s, onNew }: { s: Saved; onNew: () => void }) {
  const sub = s.submitted!;
  const [status, setStatus] = useState(sub.status);

  // Reflect real pickup by Otto (pull mode) by polling the stored status for a few minutes.
  useEffect(() => {
    if (status !== "submitted" || !s.id) return;
    let n = 0;
    const t = setInterval(async () => {
      if (++n > 36) return clearInterval(t);
      const res = await fetch(`/api/requests/${s.id}/status`, { headers: { "x-draft-token": s.draftToken! } }).catch(() => null);
      if (res?.ok) setStatus((await res.json()).status);
    }, 5000);
    return () => clearInterval(t);
  }, [status, s.id, s.draftToken]);

  const pickedUp = status !== "submitted";

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-full bg-brand text-brand-ink">
        <Icon name="check" size={22} />
      </span>
      <div className="eyebrow mt-6 text-brand-text">Brief received</div>
      <h1 tabIndex={-1} className="mt-2 font-serif text-[36px] font-bold leading-tight tracking-tight text-ink sm:text-[44px]">
        Thanks. It’s with us.
      </h1>
      <p className="mt-2 text-[16px] text-ink-2">
        Research usually takes about 10 minutes. Save the link below, then you can close this page: your results will appear there.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${pickedUp ? "bg-brand" : "bg-accent-dot"}`} />
          <span className="font-medium text-ink">{pickedUp ? "Research has started" : "Saved and queued for research"}</span>
        </div>
        <p className="mt-4 text-sm text-ink-2">
          <strong className="text-ink">Save this link.</strong> It’s private to you, and it’s the only way back to your results{sub.email ? "" : " unless you add your email"}.
        </p>
        <div className="mt-2">
          <CopyLink path={sub.statusPath} />
        </div>
        <Link
          href={sub.statusPath}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-ink hover:bg-brand-hover"
        >
          Open your request page <Icon name="arrowRight" size={15} />
        </Link>
        <p className="mt-4 text-xs text-muted">
          {sub.email ? <>We’ll email you at <strong className="text-ink-2">{sub.email}</strong> when your results are ready.</> : "Want an email when your results are ready? You can add your email on the request page."}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="eyebrow text-ink-2">What happens next</div>
        <ol className="mt-4 space-y-4">
          {[
            ["Research brief", "Arkko’s coordinator turns your brief into a research plan for the team."],
            ["Research and scoring", "Specialists research the market, consumers and feasibility, then score the opportunity."],
            ["Results", "Your results page, with sources, risks and what to test next, appears on your request page."],
          ].map(([t, b], i) => (
            <li key={t} className="flex gap-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold text-ink-2">{i + 1}</span>
              <div>
                <div className="font-medium text-ink">{t}</div>
                <div className="text-sm text-ink-2">{b}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-line-strong">
          Back to home
        </Link>
        <button type="button" onClick={onNew} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-brand-text hover:bg-brand-soft">
          Start another brief
        </button>
      </div>
    </div>
  );
}
