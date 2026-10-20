import crypto from "node:crypto";

export const newId = (prefix: string) => `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
export const newToken = () => crypto.randomBytes(24).toString("base64url");
export const now = () => new Date().toISOString();
