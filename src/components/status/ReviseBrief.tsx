"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { intakeFields } from "@/content/site";
import { Button } from "../ui";
import { Icon } from "../icons";

/** The brief's answers, editable once after the results; submitting researches the brief again. */
export function ReviseBrief({ token, answers: initial }: { token: string; answers: Record<string, string> }) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const changed = intakeFields.some((f) => (answers[f.id] ?? "").trim() !== (initial[f.id] ?? ""));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const empty = intakeFields.filter((f) => f.required && !answers[f.id]?.trim()).map((f) => f.id);
    setMissing(empty);
    if (empty.length) {
      setError("Please fill in the required answers.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/status/${token}/revise`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      router.push(`/r/${token}/status`);
    } catch (err) {
      setError(err instanceof TypeError ? "We couldn't reach the server. Please try again." : (err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-6 rounded-2xl border border-line bg-surface p-5 sm:p-7">
        {intakeFields.map((f) => {
          const invalid = missing.includes(f.id);
          const props = {
            id: `field-${f.id}`,
            value: answers[f.id] ?? "",
            maxLength: f.maxLength,
            placeholder: f.placeholder,
            "aria-invalid": invalid,
            "aria-describedby": f.help ? `help-${f.id}` : undefined,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setAnswers({ ...answers, [f.id]: e.target.value }),
            className: `w-full rounded-lg border bg-bg/40 px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 focus:border-brand focus:bg-surface focus:outline-none ${
              invalid ? "border-danger" : "border-line"
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
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-accent-line bg-accent-soft p-5 text-sm text-ink">
        You can edit your brief once. When you send it, we research it again and your new results replace the
        current ones in about 5 minutes.
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={busy || !changed}>
          {busy ? "Sending…" : "Research my edited brief"} <Icon name="arrowRight" size={15} />
        </Button>
      </div>
    </form>
  );
}
