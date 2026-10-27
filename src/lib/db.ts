import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "./config";
import { airtableStore } from "./store/airtable";
import { fileStore } from "./store/file";
import type { Store } from "./store/types";

/**
 * Storage entry point. Uses Airtable when AIRTABLE_TOKEN and AIRTABLE_BASE_ID are set,
 * otherwise the local JSON store. The rest of the app only imports from here.
 *
 * File bytes are always written to local disk. With Airtable, a copy is also attached
 * to the file's row, and used when the local copy is missing.
 */
const store: Store = config.airtable ? airtableStore : fileStore;

export { newId, newToken, now } from "./ids";

export const listRequests = () => store.listRequests();
export const getRequest = (id: string) => store.getRequest(id);
export const getByResultsToken = (token: string) => store.getByResultsToken(token);
export const peekByResultsToken = (token: string) => store.peekByResultsToken(token);
export const countSubmittedSince = (since: string) => store.countSubmittedSince(since);
export const insertRequest: Store["insertRequest"] = (rec) => store.insertRequest(rec);
export const updateRequest: Store["updateRequest"] = (id, mutate) => store.updateRequest(id, mutate);
export const updateRequestAndNotify: Store["updateRequestAndNotify"] = (id, mutate) =>
  store.updateRequestAndNotify(id, mutate);
export const listNotifications = () => store.listNotifications();
export const insertContact: Store["insertContact"] = (c) => store.insertContact(c);
export const ackNotification = (id: string) => store.ackNotification(id);

export const FILES_DIR = path.join(config.dataDir, "files");

export function localFilePath(requestId: string, name: string) {
  if (name.includes("/") || name.includes("..") || requestId.includes("/") || requestId.includes(".."))
    throw new Error("bad name");
  return path.join(FILES_DIR, requestId, name);
}

export async function writeFile(requestId: string, name: string, data: Buffer) {
  const file = localFilePath(requestId, name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

export async function readFile(requestId: string, name: string) {
  try {
    return await fs.readFile(localFilePath(requestId, name));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT" || !store.readRemoteFile) throw err;
    const remote = await store.readRemoteFile(requestId, name);
    if (!remote) throw err;
    return remote;
  }
}
