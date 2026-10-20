import "server-only";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config";
import { newId, now } from "../ids";
import { seedRecords } from "../seed";
import type {
  OttoNotification,
  RequestRecord,
  ResultsVersion,
  Review,
  StoredFile,
  WorkflowEvent,
  HandoffAttempt,
} from "../types";
import type { NotificationInput, Store } from "./types";

/**
 * Airtable store. Tables (created by scripts/airtable-setup.mjs):
 *   Requests · Files · Reviews · Results · Notifications
 * Child rows carry both a link to their request and a plain "Request ID" for filtering.
 */

const API = "https://api.airtable.com/v0";
const CONTENT_API = "https://content.airtable.com/v0";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // Airtable's direct-upload limit
const MAX_LONG_TEXT = 100_000;

const T = {
  requests: "Requests",
  files: "Files",
  reviews: "Reviews",
  results: "Results",
  notifications: "Notifications",
} as const;

/** Intake question ids shown as their own columns, for people browsing the base. */
const ANSWER_COLUMNS: Record<string, string> = {
  brand: "Brand",
  goal: "Goal",
  audience: "Audience",
  ideas: "Ideas",
  constraints: "Constraints",
};

type Fields = Record<string, unknown>;
type Row = { id: string; fields: Fields };

/* ------------------------------------------------------------------ */
/* HTTP                                                                 */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function call<T = { records: Row[]; offset?: string }>(url: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${config.airtable!.token}`, "content-type": "application/json" },
    cache: "no-store",
  });
  // Airtable allows ~5 requests/second per base; back off and retry when throttled.
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await sleep(500 * 2 ** attempt);
    return call(url, init, attempt + 1);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${JSON.stringify(body.error ?? body)}`);
  return body as T;
}

const tableUrl = (table: string) => `${API}/${config.airtable!.baseId}/${encodeURIComponent(table)}`;
const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const eq = (field: string, v: string) => `{${field}}='${esc(v)}'`;

async function list(table: string, formula?: string): Promise<Row[]> {
  const rows: Row[] = [];
  let offset: string | undefined;
  do {
    const q = new URLSearchParams({ pageSize: "100" });
    if (formula) q.set("filterByFormula", formula);
    if (offset) q.set("offset", offset);
    const body = await call(`${tableUrl(table)}?${q}`);
    rows.push(...body.records);
    offset = body.offset;
  } while (offset);
  return rows;
}

const chunks = <X,>(xs: X[], n = 10) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

async function create(table: string, items: Fields[]): Promise<Row[]> {
  const out: Row[] = [];
  for (const c of chunks(items)) {
    const body = await call(tableUrl(table), {
      method: "POST",
      body: JSON.stringify({ records: c.map((fields) => ({ fields })), typecast: true }),
    });
    out.push(...body.records);
  }
  return out;
}

async function patch(table: string, items: { id: string; fields: Fields }[]) {
  for (const c of chunks(items)) {
    await call(tableUrl(table), { method: "PATCH", body: JSON.stringify({ records: c, typecast: true }) });
  }
}

async function destroy(table: string, ids: string[]) {
  for (const c of chunks(ids)) {
    const q = c.map((id) => `records[]=${encodeURIComponent(id)}`).join("&");
    await call(`${tableUrl(table)}?${q}`, { method: "DELETE" });
  }
}

/* ------------------------------------------------------------------ */
/* Tokens: hashed for lookup, encrypted so links can be rebuilt          */
/* ------------------------------------------------------------------ */

const key = () => crypto.createHash("sha256").update(`arkko-airtable:${config.signingSecret}`).digest();
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString("base64url")).join(".");
}

function decrypt(box: string) {
  const [iv, tag, ct] = box.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

/* ------------------------------------------------------------------ */
/* Mapping                                                              */
/* ------------------------------------------------------------------ */

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const json = <X,>(v: unknown, fallback: X): X => {
  try {
    return typeof v === "string" && v ? (JSON.parse(v) as X) : fallback;
  } catch {
    return fallback;
  }
};
const longJson = (v: unknown, what: string) => {
  const s = JSON.stringify(v);
  if (s.length > MAX_LONG_TEXT) throw new Error(`${what} is too large for Airtable (${s.length} characters)`);
  return s;
};

function requestFields(r: RequestRecord, withTokens: boolean): Fields {
  const f: Fields = {
    "Request ID": r.id,
    Status: r.status,
    "Answers (JSON)": longJson(r.answers, "Answers"),
    "Results email": r.email ?? null,
    "Email requested at": r.emailRequestedAt ?? null,
    "Submitted at": r.submittedAt ?? null,
    "Created at": r.createdAt,
    "Updated at": r.updatedAt,
    "Idempotency key": r.idempotencyKey,
    "Handoff log (JSON)": longJson(r.handoff, "Handoff log"),
    "Activity log (JSON)": longJson(r.events, "Activity log"),
  };
  for (const [id, col] of Object.entries(ANSWER_COLUMNS)) f[col] = r.answers[id] ?? null;
  if (withTokens) {
    f["Access token hash"] = sha(r.resultsToken);
    f["Access token (encrypted)"] = encrypt(r.resultsToken);
    f["Draft token (encrypted)"] = encrypt(r.draftToken);
  }
  return f;
}

const fileFields = (r: RequestRecord, rowId: string, f: StoredFile, kind: "intake_image" | "otto_asset"): Fields => ({
  "File ID": f.id,
  Request: [rowId],
  "Request ID": r.id,
  Kind: kind,
  "Stored name": f.name,
  "Original name": f.originalName,
  "Content type": f.contentType,
  "Size (bytes)": f.size,
  "Uploaded at": f.uploadedAt,
});

const reviewFields = (r: RequestRecord, rowId: string, v: Review): Fields => ({
  "Review ID": v.id,
  Request: [rowId],
  "Request ID": r.id,
  Stage: v.stage,
  Version: v.version,
  Title: v.title,
  Summary: v.summary,
  Body: v.body ?? null,
  "Highlights (JSON)": v.highlights ? JSON.stringify(v.highlights) : null,
  "Image (JSON)": v.image ? JSON.stringify(v.image) : null,
  Decision: v.decision?.type ?? null,
  Feedback: v.decision?.feedback ?? null,
  "Posted at": v.createdAt,
  "Decided at": v.decision?.at ?? null,
});

const resultFields = (r: RequestRecord, rowId: string, v: ResultsVersion): Fields => ({
  "Result ID": `${r.id}:v${v.version}`,
  Request: [rowId],
  "Request ID": r.id,
  Version: v.version,
  "Received at": v.receivedAt,
  "Payload (JSON)": longJson(v.payload, `Results v${v.version}`),
});

function toFile(row: Row): StoredFile {
  const f = row.fields;
  return {
    id: str(f["File ID"])!,
    name: str(f["Stored name"])!,
    originalName: str(f["Original name"]) ?? "",
    contentType: str(f["Content type"]) ?? "application/octet-stream",
    size: Number(f["Size (bytes)"] ?? 0),
    uploadedAt: str(f["Uploaded at"]) ?? "",
  };
}

function toReview(row: Row): Review {
  const f = row.fields;
  const decision = str(f.Decision) as "approved" | "changes_requested" | undefined;
  return {
    id: str(f["Review ID"])!,
    stage: str(f.Stage) as Review["stage"],
    version: Number(f.Version),
    createdAt: str(f["Posted at"])!,
    title: str(f.Title) ?? "",
    summary: str(f.Summary) ?? "",
    body: str(f.Body),
    highlights: json(f["Highlights (JSON)"], undefined),
    image: json(f["Image (JSON)"], undefined),
    decision: decision
      ? { type: decision, feedback: str(f.Feedback), at: str(f["Decided at"]) ?? "" }
      : undefined,
  };
}

function toResult(row: Row): ResultsVersion {
  const f = row.fields;
  return {
    version: Number(f.Version),
    receivedAt: str(f["Received at"])!,
    payload: json(f["Payload (JSON)"], null!),
  };
}

function toNotification(row: Row): OttoNotification {
  const f = row.fields;
  return {
    id: str(f["Notification ID"])!,
    requestId: str(f["Request ID"])!,
    type: str(f.Type) as OttoNotification["type"],
    createdAt: str(f["Created at"])!,
    data: json(f["Data (JSON)"], {}),
    ackedAt: str(f["Handled at"]),
  };
}

/** A request as loaded from Airtable, with the row ids needed to write it back. */
interface Loaded {
  rec: RequestRecord;
  rowId: string;
  fileRows: Map<string, string>; // File ID -> row id
  reviewRows: Map<string, string>; // Review ID -> row id
  resultRows: Map<number, string>; // version -> row id
}

function assemble(reqRow: Row, files: Row[], reviews: Row[], results: Row[]): Loaded {
  const f = reqRow.fields;
  const fileList = files.map((row) => ({ row, file: toFile(row), kind: str(row.fields.Kind) }));
  const rec: RequestRecord = {
    id: str(f["Request ID"])!,
    idempotencyKey: str(f["Idempotency key"]) ?? "",
    draftToken: decrypt(str(f["Draft token (encrypted)"])!),
    resultsToken: decrypt(str(f["Access token (encrypted)"])!),
    status: str(f.Status) as RequestRecord["status"],
    createdAt: str(f["Created at"])!,
    updatedAt: str(f["Updated at"])!,
    submittedAt: str(f["Submitted at"]),
    email: str(f["Results email"]),
    emailRequestedAt: str(f["Email requested at"]),
    answers: json(f["Answers (JSON)"], {}),
    images: fileList.filter((x) => x.kind === "intake_image").map((x) => x.file).sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt)),
    assets: fileList.filter((x) => x.kind === "otto_asset").map((x) => x.file),
    reviews: reviews.map(toReview).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    events: json<WorkflowEvent[]>(f["Activity log (JSON)"], []),
    handoff: json<HandoffAttempt[]>(f["Handoff log (JSON)"], []),
  };
  const res = results.map(toResult).sort((a, b) => a.version - b.version);
  if (res.length) rec.results = res;
  return {
    rec,
    rowId: reqRow.id,
    fileRows: new Map(fileList.map((x) => [x.file.id, x.row.id])),
    reviewRows: new Map(reviews.map((row) => [str(row.fields["Review ID"])!, row.id])),
    resultRows: new Map(results.map((row) => [Number(row.fields.Version), row.id])),
  };
}

async function loadWhere(formula: string): Promise<Loaded | undefined> {
  const [row] = await list(T.requests, formula);
  if (!row) return undefined;
  const id = str(row.fields["Request ID"])!;
  const [files, reviews, results] = await Promise.all([
    list(T.files, eq("Request ID", id)),
    list(T.reviews, eq("Request ID", id)),
    list(T.results, eq("Request ID", id)),
  ]);
  return assemble(row, files, reviews, results);
}

/* ------------------------------------------------------------------ */
/* Writing                                                              */
/* ------------------------------------------------------------------ */

/** Write the changes between `before` and `after`. Files and result versions are immutable once written. */
async function persist(loaded: Loaded, before: RequestRecord, after: RequestRecord) {
  await patch(T.requests, [{ id: loaded.rowId, fields: requestFields(after, false) }]);

  // Files
  const files = [
    ...after.images.map((f) => ({ f, kind: "intake_image" as const })),
    ...after.assets.map((f) => ({ f, kind: "otto_asset" as const })),
  ];
  const newFiles = files.filter(({ f }) => !loaded.fileRows.has(f.id));
  const keep = new Set(files.map(({ f }) => f.id));
  const removed = [...loaded.fileRows].filter(([id]) => !keep.has(id)).map(([, row]) => row);
  const created = await create(T.files, newFiles.map(({ f, kind }) => fileFields(after, loaded.rowId, f, kind)));
  if (removed.length) await destroy(T.files, removed);
  await Promise.all(created.map((row, i) => attach(after.id, row.id, newFiles[i].f)));

  // Reviews: create new ones, update changed ones (decisions)
  const prev = new Map(before.reviews.map((v) => [v.id, JSON.stringify(v)]));
  const newReviews = after.reviews.filter((v) => !loaded.reviewRows.has(v.id));
  const changed = after.reviews.filter((v) => loaded.reviewRows.has(v.id) && prev.get(v.id) !== JSON.stringify(v));
  await create(T.reviews, newReviews.map((v) => reviewFields(after, loaded.rowId, v)));
  await patch(
    T.reviews,
    changed.map((v) => ({ id: loaded.reviewRows.get(v.id)!, fields: reviewFields(after, loaded.rowId, v) })),
  );

  // Results versions
  const newResults = (after.results ?? []).filter((v) => !loaded.resultRows.has(v.version));
  await create(T.results, newResults.map((v) => resultFields(after, loaded.rowId, v)));
}

/** Attach a copy of the file to its Airtable row so people can see it in the base. Best effort. */
async function attach(requestId: string, rowId: string, f: StoredFile) {
  if (f.size > MAX_ATTACHMENT_BYTES) return;
  try {
    const dataDir = process.env.ARKKO_DATA_DIR ?? path.join(process.cwd(), ".data");
    const bytes = await fs.readFile(path.join(dataDir, "files", requestId, f.name));
    await call(`${CONTENT_API}/${config.airtable!.baseId}/${rowId}/Attachment/uploadAttachment`, {
      method: "POST",
      body: JSON.stringify({ contentType: f.contentType, file: bytes.toString("base64"), filename: f.originalName || f.name }),
    });
  } catch (err) {
    console.warn(`[airtable] could not attach ${f.name}: ${(err as Error).message}`);
  }
}

async function insertNew(rec: RequestRecord): Promise<Loaded> {
  const [row] = await create(T.requests, [requestFields(rec, true)]);
  const loaded: Loaded = { rec, rowId: row.id, fileRows: new Map(), reviewRows: new Map(), resultRows: new Map() };
  const empty = { ...rec, images: [], assets: [], reviews: [], results: [] };
  if (rec.images.length || rec.assets.length || rec.reviews.length || rec.results?.length) {
    await persist(loaded, empty, rec);
  }
  return loaded;
}

/* ------------------------------------------------------------------ */
/* Concurrency and seeding                                              */
/* ------------------------------------------------------------------ */

let queue: Promise<unknown> = Promise.resolve();

/** Serialize writes within this process. Airtable has no transactions. */
function exclusive<X>(fn: () => Promise<X>): Promise<X> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

let seeded: Promise<void> | undefined;

/** Load the demo requests into Airtable once, if they aren't there. */
function ensureSeeded() {
  seeded ??= exclusive(async () => {
    const seeds = seedRecords();
    const existing = await list(T.requests, `OR(${seeds.map((s) => eq("Request ID", s.id)).join(",")})`);
    const have = new Set(existing.map((r) => str(r.fields["Request ID"])));
    for (const s of seeds) if (!have.has(s.id)) await insertNew(s);
  }).catch((err) => {
    seeded = undefined; // try again on the next call
    throw err;
  });
  return seeded;
}

async function update<X>(
  id: string,
  mutate: (r: RequestRecord) => X | Promise<X>,
): Promise<{ loaded: Loaded; result: X } | undefined> {
  await ensureSeeded();
  return exclusive(async () => {
    const loaded = await loadWhere(eq("Request ID", id));
    if (!loaded) return undefined;
    const before = structuredClone(loaded.rec);
    const result = await mutate(loaded.rec);
    loaded.rec.updatedAt = now();
    await persist(loaded, before, loaded.rec);
    return { loaded, result };
  });
}

/* ------------------------------------------------------------------ */

export const airtableStore: Store = {
  async listRequests() {
    await ensureSeeded();
    const [reqs, files, reviews, results] = await Promise.all([
      list(T.requests),
      list(T.files),
      list(T.reviews),
      list(T.results),
    ]);
    const by = (rows: Row[]) => {
      const m = new Map<string, Row[]>();
      rows.forEach((r) => {
        const id = str(r.fields["Request ID"]) ?? "";
        m.set(id, [...(m.get(id) ?? []), r]);
      });
      return m;
    };
    const [f, v, r] = [by(files), by(reviews), by(results)];
    return reqs.map((row) => {
      const id = str(row.fields["Request ID"])!;
      return assemble(row, f.get(id) ?? [], v.get(id) ?? [], r.get(id) ?? []).rec;
    });
  },

  async getRequest(id) {
    await ensureSeeded();
    return (await loadWhere(eq("Request ID", id)))?.rec;
  },

  async getByResultsToken(token) {
    await ensureSeeded();
    return (await loadWhere(eq("Access token hash", sha(token))))?.rec;
  },

  async insertRequest(rec) {
    await ensureSeeded();
    return exclusive(async () => {
      const existing = await loadWhere(eq("Idempotency key", rec.idempotencyKey));
      if (existing) return existing.rec;
      return (await insertNew(rec)).rec;
    });
  },

  async updateRequest(id, mutate) {
    return (await update(id, mutate))?.loaded.rec;
  },

  async updateRequestAndNotify(id, mutate) {
    const out = await update<NotificationInput | void>(id, mutate);
    if (!out) return undefined;
    let notification: OttoNotification | undefined;
    if (out.result) {
      notification = { id: newId("ntf"), requestId: id, createdAt: now(), ...out.result };
      await create(T.notifications, [
        {
          "Notification ID": notification.id,
          Request: [out.loaded.rowId],
          "Request ID": id,
          Type: notification.type,
          "Data (JSON)": JSON.stringify(notification.data),
          "Created at": notification.createdAt,
        },
      ]);
    }
    return { rec: out.loaded.rec, notification };
  },

  async listNotifications() {
    const rows = await list(T.notifications, "{Handled at}=BLANK()");
    return rows.map(toNotification).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  ackNotification(id) {
    return exclusive(async () => {
      const [row] = await list(T.notifications, eq("Notification ID", id));
      if (!row) return undefined;
      const n = toNotification(row);
      if (!n.ackedAt) {
        n.ackedAt = now();
        await patch(T.notifications, [{ id: row.id, fields: { "Handled at": n.ackedAt } }]);
      }
      return n;
    });
  },

  async readRemoteFile(requestId, name) {
    const [row] = await list(T.files, `AND(${eq("Request ID", requestId)},${eq("Stored name", name)})`);
    const att = (row?.fields.Attachment as { url: string }[] | undefined)?.[0];
    if (!att) return undefined;
    const res = await fetch(att.url, { cache: "no-store" });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : undefined;
  },
};
