"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type Anthropic from "@anthropic-ai/sdk";
import { intakeFields, site } from "@/content/site";
import { Icon } from "../icons";
import { Button, Spinner } from "../ui";

type Param = Anthropic.Beta.BetaMessageParam;

/** Kept with the rest of the intake progress. `history` is sent back to the API unchanged each turn. */
export interface ChatState {
  history: Param[];
  brief?: Record<string, string>;
  /** Progress through the questions when the chat runs without Claude. */
  guided?: { at: number; answers: Record<string, string> };
}

const ask = (i: number) => `${intakeFields[i].label}${intakeFields[i].help ? ` ${intakeFields[i].help}` : ""}`;

/** One turn without Claude: record the answer to the current question and ask the next one. */
function guidedTurn(chat: ChatState, message: string): ChatState {
  const g = chat.guided ?? { at: 0, answers: {} };
  const answers = { ...g.answers };
  const copy = site.intake.guided;
  const [skip, unsure, done] = site.intake.quickReplies;
  const field = intakeFields[g.at];
  const missing = () => intakeFields.findIndex((f) => f.required && !answers[f.id]?.trim());
  let at = g.at;
  let reply: string | undefined;

  if (message === done) {
    const m = missing();
    if (m >= 0) {
      at = m;
      reply = `${copy.beforeWrapUp} ${ask(m)}`;
    } else at = intakeFields.length;
  } else if (message === skip || message === unsure) {
    if (field.required) reply = `${copy.required} ${ask(g.at)}`;
    else answers[field.id] = "";
  } else {
    answers[field.id] = message.slice(0, field.maxLength);
  }

  if (reply === undefined) {
    // Next question nobody has answered or skipped yet.
    while (at < intakeFields.length && answers[intakeFields[at].id] !== undefined) at++;
    reply = at < intakeFields.length ? `${copy.acks[at % copy.acks.length]} ${ask(at)}` : copy.done;
  }
  const finished = at >= intakeFields.length;
  return {
    history: [
      ...chat.history,
      { role: "user", content: message },
      { role: "assistant", content: [{ type: "text", text: reply }] },
    ],
    guided: { at, answers },
    brief: finished ? Object.fromEntries(Object.entries(answers).filter(([, v]) => v.trim())) : undefined,
  };
}

/** Visible text of a message: text blocks only, and after a model fallback only the final model's text. */
function textOf(m: Param): string {
  if (typeof m.content === "string") return m.content;
  const start = m.content.map((b) => b.type).lastIndexOf("fallback") + 1;
  return m.content
    .slice(start)
    .filter((b): b is Anthropic.Beta.BetaTextBlockParam => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/** The conversation as the customer saw it, greeting included, for saving with the request. */
export function transcriptOf(chat: ChatState) {
  return [
    { from: "arkko" as const, text: site.intake.greeting },
    ...chat.history.map((m) => ({ from: m.role === "user" ? ("customer" as const) : ("arkko" as const), text: textOf(m) })),
  ].filter((l) => l.text);
}

export function ChatBrief({
  chat,
  ai,
  busy,
  onChange,
  onConfirm,
  onUseForm,
}: {
  chat: ChatState;
  /** Talk to Claude. When false, ask the intake questions in order with set replies. */
  ai: boolean;
  busy: boolean;
  onChange: (chat: ChatState) => void;
  onConfirm: (answers: Record<string, string>) => void;
  onUseForm: (answers?: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState<{ user: string; reply: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const turns = chat.history
    .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), text: textOf(m) }))
    .filter((t) => t.text);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [turns.length, live?.reply, chat.brief, error]);

  async function send(text = draft) {
    const message = text.trim();
    if (!message || live) return;
    setDraft("");
    setError(null);
    setLive({ user: message, reply: "" });
    if (!ai) {
      await new Promise((r) => setTimeout(r, 600));
      onChange(guidedTurn(chat, message));
      setLive(null);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    try {
      const res = await fetch("/api/intake/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ history: chat.history, message }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please send that again.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop()!;
        for (const line of lines) {
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.t === "text") setLive((l) => l && { ...l, reply: l.reply + ev.v });
          else if (ev.t === "error") throw new Error(ev.v);
          else if (ev.t === "done") {
            finished = true;
            onChange({ history: [...chat.history, ev.user, ev.assistant], brief: ev.brief });
          }
        }
      }
      if (!finished) throw new Error("The connection dropped. Please send that again.");
    } catch (err) {
      setDraft(message);
      setError(err instanceof TypeError ? "We couldn't reach the server. Please try again." : (err as Error).message);
    } finally {
      setLive(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <div className="mt-8">
      <ol className="space-y-4" aria-live="polite" aria-busy={!!live}>
        <Bubble from="assistant">{site.intake.greeting}</Bubble>
        {turns.map((t, i) => (
          <Bubble key={i} from={t.role}>{t.text}</Bubble>
        ))}
        {live && (
          <>
            <Bubble from="user">{live.user}</Bubble>
            <Bubble from="assistant">{live.reply || <Typing />}</Bubble>
          </>
        )}
      </ol>

      {chat.brief && !live && (
        <div className="mt-6 animate-[fadein_.35s_ease] rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="eyebrow text-brand-text">Your brief</div>
          <dl className="mt-4 space-y-4">
            {intakeFields
              .filter((f) => chat.brief?.[f.id])
              .map((f) => (
                <div key={f.id}>
                  <dt className="text-[13px] font-medium text-muted">{f.label}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-[15px] text-ink">{chat.brief![f.id]}</dd>
                </div>
              ))}
          </dl>
          <p className="mt-5 text-sm text-ink-2">
            {ai ? "Not quite right? Tell me what to change below, or edit it yourself." : "Not quite right? You can edit it in the form."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={() => onConfirm(chat.brief!)} disabled={busy}>
              {busy ? <Spinner /> : null} Looks good, continue <Icon name="arrowRight" size={15} />
            </Button>
            <Button type="button" variant="secondary" onClick={() => onUseForm(chat.brief)} disabled={busy}>
              Edit in the form
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {turns.length > 0 && !chat.brief && !live && (
        <div className="mt-4 flex flex-wrap gap-2 pl-11" aria-label="Quick replies">
          {site.intake.quickReplies.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => send(r)}
              className="animate-[fadein_.25s_ease] rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand-text"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <div ref={endRef} className="h-px" />

      {(ai || !chat.brief) && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="sticky bottom-0 -mx-4 mt-6 border-t border-line bg-bg/90 px-4 pb-4 pt-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-surface sm:p-2 sm:pl-4">
        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">Your message</label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            autoFocus
            value={draft}
            maxLength={4000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={turns.length ? "Type your answer…" : "e.g. VELA Beverages"}
            className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] text-ink placeholder:text-muted/70 focus:outline-none"
          />
          <Button type="submit" disabled={!draft.trim() || !!live} aria-label="Send" className="size-10 shrink-0 px-0">
            {live ? <Spinner /> : <Icon name="send" size={18} />}
          </Button>
        </div>
      </form>
      )}
      <p className="mt-3 text-center text-xs text-muted">
        Prefer all the questions on one page?{" "}
        <button type="button" onClick={() => onUseForm(chat.brief)} className="font-semibold text-brand-text hover:underline">
          Use the form
        </button>
      </p>
    </div>
  );
}

function Bubble({ from, children }: { from: "user" | "assistant"; children: ReactNode }) {
  if (from === "user") {
    return (
      <li className="flex animate-[fadein_.25s_ease] justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-[15px] leading-relaxed text-brand-ink">
          {children}
        </div>
      </li>
    );
  }
  return (
    <li className="flex animate-[fadein_.25s_ease] items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft font-serif text-[15px] font-bold text-brand-text" aria-hidden>
        a
      </span>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-2.5 text-[15px] leading-relaxed text-ink">
        <span className="sr-only">Arkko: </span>
        {children}
      </div>
    </li>
  );
}

function Typing() {
  return (
    <span className="inline-flex items-center gap-1 py-1.5" aria-label="Arkko is typing">
      {[0, 150, 300].map((d) => (
        <span key={d} className="size-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}
