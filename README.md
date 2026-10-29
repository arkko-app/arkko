# Arkko

The Arkko website, intake form, and interactive results showcase, built with Next.js 16 (App Router).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Route | What it is |
|---|---|
| `/` | Public landing page |
| `/start` | Intake: brief (chat with Arkko, or a form) → images → submit (email optional) → confirmation with the request link |
| `/r/<token>/status` | Request page: progress, idea/concept approval, history, optional "email me the results" |
| `/r/<token>` | Results showcase once ready; until then, the same status page |
| `/r/vela-demo` | Finished example showcase for the conference (known link) |
| `/r/vela-review` | Example request waiting on concept approval, for demoing the review step |

Request links are unguessable and `noindex`. They're the only way back to a request (there are no accounts), so the
confirmation screen and status page tell people to save it, and the home page links back to requests opened in that
browser. Every "Talk to Arkko" button on the public page starts the intake.

Copy and intake questions live in `src/content/site.ts`. You can replace them without touching the layout.

## Environment

| Var | Purpose | Default (dev only) |
|---|---|---|
| `ARKKO_BASE_URL` | Base for links handed to Otto | `http://localhost:3000` |
| `ARKKO_SIGNING_SECRET` | Signs file URLs and webhook bodies | dev value |
| `OTTO_API_KEY` | Bearer token for `/api/otto/*` | `dev-otto-key` |
| `OTTO_WEBHOOK_URL` | Optional. If set, new requests are pushed here | unset → Otto pulls |
| `OTTO_DISPATCH_REPO`, `OTTO_DISPATCH_TOKEN` | Optional. Start the Otto engine on GitHub Actions when a brief is submitted (`owner/repo`, token with Contents: read and write) | unset → the engine's sweep picks briefs up |
| `ARKKO_DATA_DIR` | Where records and files are stored | `.data/` (`/tmp/arkko` on Vercel) |
| `ANTHROPIC_API_KEY` | Claude API key for the intake chat (`/api/intake/chat`) | unset → chat unavailable, form still works |

### Intake chat

On `/start`, people choose between chatting with Arkko or filling in the form. The chat (Claude Opus 5.5,
`src/lib/chat.ts`) asks the same questions as the form, then shows the brief for confirmation; after that the flow is
identical (images, submit). The questions come from `intakeFields` in `src/content/site.ts`, so the chat follows any
changes there. The browser keeps the conversation and sends it back each turn; nothing from the chat is stored except
the confirmed answers. Refused requests fall back to another Claude model automatically (`fallbacks: "default"`).

## Storage

Two interchangeable stores behind `src/lib/db.ts`:

- **Airtable** when `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID` are set (`src/lib/store/airtable.ts`).
- **Local JSON** otherwise: `.data/db.json` (`src/lib/store/file.ts`).

### Airtable

Create the tables once (safe to re-run):

```bash
node --env-file=.env.local scripts/airtable-setup.mjs
```

The token needs `data.records:read`, `data.records:write`, `schema.bases:read` and `schema.bases:write` on the base.

| Table | One row per | Notes |
|---|---|---|
| Requests | Brief | Question columns are for reading; the app uses `Answers (JSON)`. Links to the other tables |
| Files | Intake image or Otto upload | Copy attached in `Attachment` (files up to 5 MB) |
| Reviews | Idea or concept version | Decision and feedback from the status page |
| Results | Published results version | Full results payload in `Payload (JSON)` |
| Notifications | Item for Otto | `Handled at` is set when Otto acks it |

The two demo requests are added automatically the first time the app talks to an empty base.

Link tokens are stored as a SHA-256 hash (for lookups) and AES-encrypted with `ARKKO_SIGNING_SECRET`, so people with
access to the base can't open request pages. Keep that secret stable: changing it makes stored requests unreadable. To change it anyway, update it everywhere (local and
Vercel) and then run `OLD_SIGNING_SECRET=<previous> node --env-file=.env.local scripts/airtable-rotate-secret.mjs`
(`--dry-run` first) to re-encrypt the stored tokens.
Hide the encrypted token columns in your Airtable views.

File bytes are also kept on local disk; on a fresh server, files are served from the Airtable attachment instead.
Images are limited to 4 MB, under both Vercel's 4.5 MB request limit and Airtable's 5 MB upload limit, so every image
has an Airtable copy. On Vercel the disk is temporary, so Airtable storage is required there.
Airtable allows about 5 requests per second per base; the store retries when throttled.

## How a request moves

1. The user submits the brief. Email is optional and is only used to send the results.
2. Otto posts an **idea** version. The user approves it or requests changes (with feedback) on the status page.
   Otto posts a new version for each round of changes.
3. Once the idea is approved, the same happens for the **concept**.
4. After concept approval, Otto researches and publishes results. If the user gave an email, Otto emails the results.

Approvals happen only in the web app, not by email.

## Otto integration

The research engine (the project owner's skill team, run with Claude) lives in the private `arkko-app/otto-engine`
repository and runs on GitHub Actions. It uses the API below like any other Otto.

Every call needs `Authorization: Bearer $OTTO_API_KEY`.

| Method | Path | |
|---|---|---|
| GET | `/api/otto/requests` | Queue: submitted requests that haven't been picked up (`?status=` filters) |
| GET | `/api/otto/requests/:id` | Intake answers, **signed image URLs** (7 days), current `stage`, all `reviews` with decisions, `resultsEmail` (or null), `statusUrl`, `resultsUrl` |
| POST | `/api/otto/requests/:id/ack` | Confirm pickup (idempotent) |
| POST | `/api/otto/requests/:id/reviews` | Post an idea or concept version: `{ stage, title, summary, body?, highlights?, image? }`. Versions number themselves. Returns 409 if posting a concept before the idea is approved, or posting to a stage that's already approved |
| GET | `/api/otto/notifications` | Things to act on: `review.decided` (approved / changes requested + feedback) and `results_email.requested` |
| POST | `/api/otto/notifications/:id/ack` | Mark a notification handled |
| POST | `/api/otto/requests/:id/events` | Log `research_started`, `final_email_sent`, or `error` |
| POST | `/api/otto/requests/:id/assets` | Upload a result image or the final PDF (multipart `file`) → `{ ref: "asset:…" }` |
| PUT | `/api/otto/requests/:id/results` | Publish structured results (contract: `src/lib/types.ts` `ResultsPayload`). Each PUT creates a new version; the latest one is shown |
| PUT | `/api/otto/requests/:id/results/pdf` | Attach the PDF of a results version (multipart `file`, `version`; max 4 MB). Shows the Download PDF button |

Push mode: when `OTTO_WEBHOOK_URL` is set, new requests (`request.submitted`) and every notification
(`review.decided`, `results_email.requested`) are also POSTed there, signed with `x-arkko-signature`
(HMAC-SHA256 of the body). For a submitted request, only a 2xx response counts as handed off; a failure is shown to
the user, who can retry without creating a duplicate. Notifications stay in the queue either way until Otto acks them.

Log `final_email_sent` after emailing the results, so the status page shows they were sent.

Results validation rejects payloads where a "sourced" finding cites no source, a chart has no source, a source ID is unknown, or an `asset:` reference was never uploaded. Sections with no content are hidden, never filled with placeholders.

To see example payloads, look at `src/lib/seed.ts`.
