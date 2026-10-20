import "server-only";
import crypto from "node:crypto";
import { config } from "./config";

const DAY = 24 * 60 * 60;

function signature(requestId: string, name: string, exp: number) {
  return crypto
    .createHmac("sha256", config.signingSecret)
    .update(`${requestId}/${name}:${exp}`)
    .digest("base64url");
}

/** Time-limited URL for a stored file. Used for Otto's image access and showcase rendering. */
export function signedFileUrl(
  requestId: string,
  name: string,
  { ttlSeconds = 7 * DAY, absolute = false } = {},
) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const rel = `/api/files/${requestId}/${encodeURIComponent(name)}?exp=${exp}&sig=${signature(requestId, name, exp)}`;
  return absolute ? `${config.baseUrl}${rel}` : rel;
}

export function verifyFileSignature(requestId: string, name: string, exp: string, sig: string) {
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now() / 1000) return false;
  const expected = Buffer.from(signature(requestId, name, expNum));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export function resultsUrl(token: string) {
  return `${config.baseUrl}/r/${token}`;
}

export function statusUrl(token: string) {
  return `${config.baseUrl}/r/${token}/status`;
}
