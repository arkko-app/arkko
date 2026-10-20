import type { OttoNotification, RequestRecord } from "../types";

export type NotificationInput = Omit<OttoNotification, "id" | "requestId" | "createdAt">;

/** Everything the app needs from storage. Implemented by the local file store and the Airtable store. */
export interface Store {
  listRequests(): Promise<RequestRecord[]>;
  getRequest(id: string): Promise<RequestRecord | undefined>;
  getByResultsToken(token: string): Promise<RequestRecord | undefined>;
  /** Returns the existing request if one with the same idempotency key exists. */
  insertRequest(rec: RequestRecord): Promise<RequestRecord>;
  updateRequest(
    id: string,
    mutate: (r: RequestRecord) => void | Promise<void>,
  ): Promise<RequestRecord | undefined>;
  /** Update a request and queue a notification for Otto in the same operation. */
  updateRequestAndNotify(
    id: string,
    mutate: (r: RequestRecord) => NotificationInput | void,
  ): Promise<{ rec: RequestRecord; notification?: OttoNotification } | undefined>;
  listNotifications(): Promise<OttoNotification[]>;
  ackNotification(id: string): Promise<OttoNotification | undefined>;
  /** Fallback for files missing from local disk (e.g. on a fresh server). */
  readRemoteFile?(requestId: string, name: string): Promise<Buffer | undefined>;
}
