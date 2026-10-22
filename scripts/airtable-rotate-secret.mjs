/**
 * Re-encrypts the request link tokens stored in Airtable after ARKKO_SIGNING_SECRET changes,
 * so existing requests stay readable. Run it once, right after changing the secret:
 *
 *   OLD_SIGNING_SECRET=<previous value> node --env-file=.env.local scripts/airtable-rotate-secret.mjs
 *
 * OLD_SIGNING_SECRET defaults to the development value. The new secret is ARKKO_SIGNING_SECRET.
 * Add --dry-run to only check that every row can be decrypted with the old secret.
 * Rows already encrypted with the new secret are left alone, so it is safe to re-run.
 */
import crypto from "node:crypto";

const token = process.env.AIRTABLE_TOKEN;
const base = process.env.AIRTABLE_BASE_ID;
const oldSecret = process.env.OLD_SIGNING_SECRET ?? "dev-only-signing-secret";
const newSecret = process.env.ARKKO_SIGNING_SECRET;
const dryRun = process.argv.includes("--dry-run");
if (!token || !base || !newSecret) {
  console.error("Set AIRTABLE_TOKEN, AIRTABLE_BASE_ID and ARKKO_SIGNING_SECRET");
  process.exit(1);
}
if (oldSecret === newSecret) {
  console.error("OLD_SIGNING_SECRET and ARKKO_SIGNING_SECRET are the same; nothing to do");
  process.exit(1);
}

// Same scheme as src/lib/store/airtable.ts.
const keyFor = (secret) => crypto.createHash("sha256").update(`arkko-airtable:${secret}`).digest();
const oldKey = keyFor(oldSecret);
const newKey = keyFor(newSecret);

function encrypt(plain, key) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString("base64url")).join(".");
}

function decrypt(box, key) {
  const [iv, tag, ct] = box.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

const tryDecrypt = (box, key) => {
  try {
    return decrypt(box, key);
  } catch {
    return undefined;
  }
};

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.airtable.com/v0/${base}/Requests${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
};

const FIELDS = ["Access token (encrypted)", "Draft token (encrypted)"];

const rows = [];
let offset;
do {
  const q = new URLSearchParams([...FIELDS, "Request ID"].map((f) => ["fields[]", f]));
  if (offset) q.set("offset", offset);
  const page = await api(`?${q}`);
  rows.push(...page.records);
  offset = page.offset;
} while (offset);

const updates = [];
let current = 0;
const failed = [];
for (const row of rows) {
  const fields = {};
  let ok = true;
  let alreadyNew = true;
  for (const name of FIELDS) {
    const box = row.fields[name];
    if (!box) continue;
    if (tryDecrypt(box, newKey) !== undefined) continue;
    alreadyNew = false;
    const plain = tryDecrypt(box, oldKey);
    if (plain === undefined) ok = false;
    else fields[name] = encrypt(plain, newKey);
  }
  if (!ok) failed.push(row.fields["Request ID"] ?? row.id);
  else if (alreadyNew) current++;
  else updates.push({ id: row.id, fields });
}

console.log(`${rows.length} requests: ${updates.length} to re-encrypt, ${current} already on the new secret, ${failed.length} unreadable`);
if (failed.length) {
  console.error(`Not readable with the old secret: ${failed.join(", ")}. Nothing was changed.`);
  process.exit(1);
}
if (dryRun) process.exit(0);

// Airtable updates at most 10 records per request and about 5 requests per second.
for (let i = 0; i < updates.length; i += 10) {
  await api("", { method: "PATCH", body: JSON.stringify({ records: updates.slice(i, i + 10) }) });
  await new Promise((r) => setTimeout(r, 250));
}
console.log(`Re-encrypted ${updates.length} requests.`);
