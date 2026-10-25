import "server-only";
import crypto from "node:crypto";
import { config } from "./config";
import { now, updateRequest } from "./db";
import { resultsUrl, signedFileUrl, statusUrl } from "./sign";
import { currentStage } from "./stage";
import type { OttoNotification, RequestRecord } from "./types";

/** The intake contract: everything Otto needs, with real (signed) image URLs. */
export function intakeForOtto(r: RequestRecord) {
  return {
    id: r.id,
    status: r.status,
    stage: currentStage(r),
    submittedAt: r.submittedAt,
    answers: r.answers,
    /** The intake conversation, when the brief was given by chat (readable text), otherwise null. */
    chatTranscript: r.chatTranscript ?? null,
    images: r.images.map((img) => ({
      id: img.id,
      originalName: img.originalName,
      contentType: img.contentType,
      size: img.size,
      url: signedFileUrl(r.id, img.name, { absolute: true }),
    })),
    reviews: r.reviews,
    /** Set only if the user asked for the results by email. */
    resultsEmail: r.email ?? null,
    statusUrl: statusUrl(r.resultsToken),
    resultsUrl: resultsUrl(r.resultsToken),
  };
}

export function isOttoAuthorized(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(config.ottoApiKey);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** POST a signed event to Otto's webhook. Only a 2xx counts as delivered. */
async function push(event: string, payload: unknown, idempotencyKey: string) {
  const body = JSON.stringify({ event, ...((payload as object) ?? {}) });
  const signature = crypto.createHmac("sha256", config.signingSecret).update(body).digest("hex");
  try {
    const res = await fetch(config.ottoWebhookUrl!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-arkko-signature": signature,
        "idempotency-key": idempotencyKey,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, message: `Otto responded ${res.status}` };
  } catch (err) {
    return { ok: false, message: `Could not reach Otto: ${(err as Error).message}` };
  }
}

/**
 * Ask GitHub to run the Otto engine now for this request: "brief-submitted" starts the research,
 * "results-email" sends a requested results email. Returns a line for the handoff log.
 */
async function dispatch(requestId: string, eventType: "brief-submitted" | "results-email" = "brief-submitted") {
  const { repo, token } = config.ottoDispatch!;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "content-type": "application/json",
      },
      body: JSON.stringify({ event_type: eventType, client_payload: { requestId } }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok
      ? "Queued for Otto; research engine started"
      : `Queued for Otto; engine start failed (GitHub ${res.status}), the next sweep will pick it up`;
  } catch (err) {
    return `Queued for Otto; could not reach GitHub (${(err as Error).message}), the next sweep will pick it up`;
  }
}

/**
 * Hand a submitted request to Otto.
 *
 * push mode (OTTO_WEBHOOK_URL set): POST the intake; only a 2xx counts as handed off.
 * pull mode (no webhook): the request sits in Otto's queue until Otto acks it.
 * Status is never reported as handed off unless Otto actually confirmed it.
 */
export async function handOff(r: RequestRecord) {
  if (!config.ottoWebhookUrl) {
    // The queue is the source of truth; the dispatch only makes the engine start now instead of at its next sweep.
    const started = config.ottoDispatch ? await dispatch(r.id) : undefined;
    return updateRequest(r.id, (rec) => {
      rec.handoff.push({ at: now(), mode: "pull", ok: true, message: started ?? "Queued for Otto to collect" });
    });
  }

  const { ok, message } = await push("request.submitted", { request: intakeForOtto(r) }, r.id);
  return updateRequest(r.id, (rec) => {
    rec.handoff.push({ at: now(), mode: "push", ok, message });
    if (rec.status === "submitted" || rec.status === "handoff_failed") {
      rec.status = ok ? "handed_off" : "handoff_failed";
    }
  });
}

/**
 * Tell Otto about a user action. The notification is already stored, so Otto can
 * always collect it from GET /api/otto/notifications; the push is a fast path.
 */
export async function pushNotification(n: OttoNotification | undefined) {
  if (!n) return;
  if (config.ottoWebhookUrl) {
    await push(n.type, { notification: n }, n.id);
  } else if (config.ottoDispatch && n.type === "results_email.requested") {
    await dispatch(n.requestId, "results-email");
  }
}
