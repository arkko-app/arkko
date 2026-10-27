"use client";

import { useState } from "react";
import { site } from "@/content/site";
import { Icon } from "../icons";
import { Button, Spinner } from "../ui";

const copy = site.home.contact;
const FIELDS = [
  { id: "name", label: copy.fields.name, type: "text", autoComplete: "name", required: true, maxLength: 120 },
  { id: "email", label: copy.fields.email, type: "email", autoComplete: "email", required: true, maxLength: 254 },
  { id: "company", label: copy.fields.company, type: "text", autoComplete: "organization", required: false, maxLength: 160 },
] as const;

type Values = { name: string; email: string; company: string; message: string; website: string };

export function ContactForm() {
  const [v, setV] = useState<Values>({ name: "", email: "", company: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(v),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.details?.fields ?? {});
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn’t reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-lg border-[1.5px] border-ink bg-pistachio p-8">
        <span className="grid size-11 place-items-center rounded-full border-[1.5px] border-ink bg-surface">
          <Icon name="check" size={20} />
        </span>
        <h2 className="font-serif text-[32px] font-black leading-tight tracking-[-0.02em]">{copy.sentTitle}</h2>
        <p className="text-[17px]">{copy.sentBody}</p>
      </div>
    );
  }

  const input = (id: string) =>
    `w-full rounded-lg border-[1.5px] bg-surface px-3.5 py-3 text-[16px] text-ink focus:outline-none ${errors[id] ? "border-danger" : "border-ink"}`;

  return (
    <form onSubmit={send} noValidate className="flex flex-col gap-5 rounded-lg border-[1.5px] border-ink bg-surface-2 p-[clamp(20px,4vw,40px)]">
      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {FIELDS.map((f) => (
        <div key={f.id}>
          <label htmlFor={`contact-${f.id}`} className="block text-[15px] font-bold">
            {f.label}
          </label>
          <input
            id={`contact-${f.id}`}
            type={f.type}
            autoComplete={f.autoComplete}
            required={f.required}
            maxLength={f.maxLength}
            value={v[f.id]}
            onChange={(e) => setV({ ...v, [f.id]: e.target.value })}
            aria-invalid={!!errors[f.id]}
            aria-describedby={errors[f.id] ? `contact-${f.id}-err` : undefined}
            className={`mt-2 ${input(f.id)}`}
          />
          {errors[f.id] && <p id={`contact-${f.id}-err`} className="mt-1.5 text-sm text-danger">{errors[f.id]}</p>}
        </div>
      ))}
      <div>
        <label htmlFor="contact-message" className="block text-[15px] font-bold">
          {copy.fields.message}
        </label>
        <textarea
          id="contact-message"
          rows={5}
          required
          maxLength={4000}
          value={v.message}
          onChange={(e) => setV({ ...v, message: e.target.value })}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-err" : undefined}
          className={`mt-2 ${input("message")}`}
        />
        {errors.message && <p id="contact-message-err" className="mt-1.5 text-sm text-danger">{errors.message}</p>}
      </div>
      {/* Hidden from people; spam bots tend to fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} />
      </div>
      <div>
        <Button type="submit" disabled={busy} className="h-auto px-[22px] py-3.5 text-[15px]">
          {busy ? <Spinner /> : null} {copy.send} {!busy && <Icon name="arrowRight" size={15} />}
        </Button>
      </div>
    </form>
  );
}
