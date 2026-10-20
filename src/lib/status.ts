import type { RequestRecord } from "./types";

/** What the submitting browser is allowed to see about its request. */
export function publicStatus(r: RequestRecord) {
  const last = r.handoff.at(-1);
  return {
    id: r.id,
    status: r.status,
    email: r.email ?? null,
    statusPath: `/r/${r.resultsToken}/status`,
    handoff: last ? { mode: last.mode, ok: last.ok, at: last.at } : null,
  };
}
