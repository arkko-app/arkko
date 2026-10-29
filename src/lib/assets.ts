import "server-only";
import { newId, now, writeFile } from "./db";
import type { StoredFile } from "./types";

/** File types Otto may upload, with the extension each is stored under. */
export const ASSET_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

/** Store an uploaded file under a new name. The caller adds the returned record to the request's assets. */
export async function saveAsset(requestId: string, file: File): Promise<StoredFile> {
  const name = `${newId("asset")}.${ASSET_TYPES[file.type]}`;
  await writeFile(requestId, name, Buffer.from(await file.arrayBuffer()));
  return {
    id: name,
    name,
    originalName: file.name.slice(0, 200),
    contentType: file.type,
    size: file.size,
    uploadedAt: now(),
  };
}
