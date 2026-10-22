import "server-only";
import path from "node:path";

export const config = {
  /** Public base URL used in links handed to Otto (results link, image URLs). */
  baseUrl: process.env.ARKKO_BASE_URL ?? "http://localhost:3000",
  /**
   * Where records and files are written on disk. On Vercel only /tmp is writable (and temporary),
   * so files there are a cache: with Airtable, images are also stored as attachments.
   */
  dataDir: process.env.ARKKO_DATA_DIR ?? (process.env.VERCEL ? "/tmp/arkko" : path.join(process.cwd(), ".data")),
  /** Signs file URLs. Must be set in any shared environment. */
  signingSecret: process.env.ARKKO_SIGNING_SECRET ?? "dev-only-signing-secret",
  /** Bearer token Otto uses to call /api/otto/*. */
  ottoApiKey: process.env.OTTO_API_KEY ?? "dev-otto-key",
  /** Optional: if set, new requests are pushed here. Otherwise Otto pulls the queue. */
  ottoWebhookUrl: process.env.OTTO_WEBHOOK_URL || undefined,
  /** The intake chat uses Claude when an API key is set; otherwise it asks the form's questions one by one. */
  chatEnabled: !!process.env.ANTHROPIC_API_KEY,
  /** Store data in Airtable when both are set; otherwise use the local JSON store. */
  airtable:
    process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE_ID
      ? { token: process.env.AIRTABLE_TOKEN, baseId: process.env.AIRTABLE_BASE_ID }
      : undefined,
};

export const uploadRules = {
  maxImages: 6,
  /** Under Vercel's 4.5 MB request limit and Airtable's 5 MB attachment limit, so every image is also kept in Airtable. */
  maxBytes: 4 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};
