import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config";
import type { OttoNotification, RequestRecord } from "../types";
import { newId, now } from "../ids";
import { seedRecords } from "../seed";
import type { Store } from "./types";

/** Local JSON store for development: records in .data/db.json. */

const DATA_DIR = config.dataDir;
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DB {
  requests: RequestRecord[];
  notifications: OttoNotification[];
}

let queue: Promise<unknown> = Promise.resolve();

/** Serialize all writes within this process. */
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function load(): Promise<DB> {
  try {
    const db = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as DB;
    db.notifications ??= [];
    db.requests.forEach((r) => (r.reviews ??= []));
    return db;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const db: DB = { requests: seedRecords(), notifications: [] };
    await save(db);
    return db;
  }
}

async function save(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_FILE);
}

export const fileStore: Store = {
  async listRequests() {
    return (await load()).requests;
  },

  async getRequest(id) {
    return (await load()).requests.find((r) => r.id === id);
  },

  async getByResultsToken(token) {
    return (await load()).requests.find((r) => r.resultsToken === token);
  },

  async peekByResultsToken(token) {
    const r = (await load()).requests.find((r) => r.resultsToken === token);
    return r && { status: r.status, updatedAt: r.updatedAt };
  },

  insertRequest(rec) {
    return exclusive(async () => {
      const db = await load();
      const existing = db.requests.find((r) => r.idempotencyKey === rec.idempotencyKey);
      if (existing) return existing;
      db.requests.push(rec);
      await save(db);
      return rec;
    });
  },

  updateRequest(id, mutate) {
    return exclusive(async () => {
      const db = await load();
      const rec = db.requests.find((r) => r.id === id);
      if (!rec) return undefined;
      await mutate(rec);
      rec.updatedAt = now();
      await save(db);
      return rec;
    });
  },

  updateRequestAndNotify(id, mutate) {
    return exclusive(async () => {
      const db = await load();
      const rec = db.requests.find((r) => r.id === id);
      if (!rec) return undefined;
      const n = mutate(rec);
      rec.updatedAt = now();
      const notification = n ? { id: newId("ntf"), requestId: id, createdAt: now(), ...n } : undefined;
      if (notification) db.notifications.push(notification);
      await save(db);
      return { rec, notification };
    });
  },

  async listNotifications() {
    return (await load()).notifications.filter((n) => !n.ackedAt);
  },

  ackNotification(id) {
    return exclusive(async () => {
      const db = await load();
      const n = db.notifications.find((x) => x.id === id);
      if (!n) return undefined;
      n.ackedAt ??= now();
      await save(db);
      return n;
    });
  },
};
