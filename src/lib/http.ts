import "server-only";
import crypto from "node:crypto";
import type { RequestRecord } from "./types";

export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const fail = (status: number, error: string, details?: unknown) =>
  Response.json({ error, details }, { status });

export function hasDraftAccess(req: Request, rec: RequestRecord) {
  const given = Buffer.from(req.headers.get("x-draft-token") ?? "");
  const expected = Buffer.from(rec.draftToken);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}
