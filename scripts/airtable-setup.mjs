/**
 * Creates the Arkko tables in an Airtable base. Safe to re-run: existing tables are kept and
 * only missing columns are added.
 *
 *   node --env-file=.env.local scripts/airtable-setup.mjs
 *
 * Needs AIRTABLE_TOKEN (scopes: schema.bases:read, schema.bases:write) and AIRTABLE_BASE_ID.
 */
const token = process.env.AIRTABLE_TOKEN;
const base = process.env.AIRTABLE_BASE_ID;
if (!token || !base) {
  console.error("Set AIRTABLE_TOKEN and AIRTABLE_BASE_ID");
  process.exit(1);
}

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
};

const text = (name, description) => ({ name, type: "singleLineText", description });
const long = (name, description) => ({ name, type: "multilineText", description });
const date = (name) => ({
  name,
  type: "dateTime",
  options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "utc" },
});
const select = (name, choices) => ({ name, type: "singleSelect", options: { choices: choices.map((c) => ({ name: c })) } });
const num = (name) => ({ name, type: "number", options: { precision: 0 } });
const link = (requestsId) => ({
  name: "Request",
  type: "multipleRecordLinks",
  options: { linkedTableId: requestsId },
});

const TABLES = [
  {
    name: "Requests",
    description: "One row per brief. Answers (JSON) is what the app reads; the question columns are for people.",
    fields: () => [
      text("Request ID"),
      select("Status", ["draft", "submitted", "handed_off", "handoff_failed", "in_progress", "results_ready"]),
      text("Brand"),
      long("Goal"),
      long("Audience"),
      long("Product"),
      long("Occasion"),
      text("Market"),
      long("Channels"),
      text("Price"),
      long("Ideas"),
      long("Constraints"),
      long("Answers (JSON)", "All intake answers. Source of truth for the app."),
      long("Chat transcript", "The intake conversation with Arkko, when the brief was given by chat."),
      { name: "Results email", type: "email" },
      date("Email requested at"),
      date("Submitted at"),
      date("Created at"),
      date("Updated at"),
      text("Idempotency key", "Stops a retried submit from creating a duplicate."),
      text("Access token hash", "SHA-256 of the request link token, used to look requests up."),
      text("Access token (encrypted)", "Encrypted with ARKKO_SIGNING_SECRET. Hide this column."),
      text("Draft token (encrypted)", "Encrypted with ARKKO_SIGNING_SECRET. Hide this column."),
      long("Handoff log (JSON)"),
      long("Activity log (JSON)", "Workflow events: received, research started, results published, email sent…"),
    ],
  },
  {
    name: "Files",
    description: "Intake images and files Otto uploads (result images, final PDF).",
    fields: (r) => [
      text("File ID"),
      link(r),
      text("Request ID"),
      select("Kind", ["intake_image", "otto_asset"]),
      text("Stored name"),
      text("Original name"),
      text("Content type"),
      num("Size (bytes)"),
      date("Uploaded at"),
      { name: "Attachment", type: "multipleAttachments" },
    ],
  },
  {
    name: "Reviews",
    description: "Idea and concept versions Otto posts, and the user's decision on each.",
    fields: (r) => [
      text("Review ID"),
      link(r),
      text("Request ID"),
      select("Stage", ["idea", "concept"]),
      num("Version"),
      text("Title"),
      long("Summary"),
      long("Body"),
      long("Highlights (JSON)"),
      long("Image (JSON)"),
      select("Decision", ["approved", "changes_requested"]),
      long("Feedback"),
      date("Posted at"),
      date("Decided at"),
    ],
  },
  {
    name: "Results",
    description: "Each results version Otto publishes. The showcase renders the latest.",
    fields: (r) => [
      text("Result ID"),
      link(r),
      text("Request ID"),
      num("Version"),
      date("Received at"),
      long("Payload (JSON)", "Results contract v1 (ResultsPayload)."),
    ],
  },
  {
    name: "Notifications",
    description: "Queue of user actions for Otto: review decisions and results-email requests.",
    fields: (r) => [
      text("Notification ID"),
      link(r),
      text("Request ID"),
      select("Type", ["review.decided", "results_email.requested"]),
      long("Data (JSON)"),
      date("Created at"),
      date("Handled at"),
    ],
  },
  {
    name: "Contacts",
    description: "Messages sent through the contact form on the home page.",
    fields: () => [
      text("Contact ID"),
      text("Name"),
      { name: "Email", type: "email" },
      text("Company"),
      long("Message"),
      date("Created at"),
    ],
  },
];

const { tables } = await api("/tables");
const byName = new Map(tables.map((t) => [t.name, t]));

for (const t of TABLES) {
  const existing = byName.get(t.name);
  if (existing) {
    console.log(`= ${t.name} already exists (${existing.id})`);
    // Add columns introduced since the table was created.
    const have = new Set(existing.fields.map((f) => f.name));
    for (const field of t.fields(byName.get("Requests")?.id)) {
      if (have.has(field.name)) continue;
      await api(`/tables/${existing.id}/fields`, { method: "POST", body: JSON.stringify(field) });
      console.log(`  + ${t.name}: added column "${field.name}"`);
    }
    continue;
  }
  const created = await api("/tables", {
    method: "POST",
    body: JSON.stringify({ name: t.name, description: t.description, fields: t.fields(byName.get("Requests")?.id) }),
  });
  byName.set(created.name, created);
  console.log(`+ ${t.name} created (${created.id})`);
}
