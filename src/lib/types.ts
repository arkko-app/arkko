/**
 * Data contracts shared by the web app and Otto.
 *
 * Intake contract  — what the web app hands to Otto (see GET /api/otto/requests/:id).
 * Results contract — what Otto hands back (see PUT /api/otto/requests/:id/results).
 */

export type RequestStatus =
  | "draft" // intake started, email not yet provided
  | "submitted" // intake + email complete, waiting for handoff
  | "handed_off" // Otto confirmed receipt (push accepted or ack received)
  | "handoff_failed" // push attempted and failed; retryable
  | "in_progress" // Otto has reported workflow activity
  | "results_ready";

export type WorkflowEventType =
  | "received"
  | "review_posted" // Otto posted an idea or concept version for the user
  | "review_decided" // the user approved or requested changes in the web app
  | "research_started"
  | "research_progress" // Otto finished a research step; data.step names it (see RESEARCH_STEPS)
  | "results_published"
  | "final_email_sent" // Otto emailed the results (only when the user asked)
  | "error";

export type ReviewStage = "idea" | "concept";

/** An idea or concept version Otto posts for the user to approve in the web app. */
export interface Review {
  id: string;
  stage: ReviewStage;
  version: number;
  createdAt: string;
  title: string;
  summary: string;
  /** Longer explanation. Blank lines separate paragraphs. */
  body?: string;
  highlights?: { label: string; value: string }[];
  image?: ResultImage;
  decision?: {
    type: "approved" | "changes_requested";
    feedback?: string;
    at: string;
  };
}

/** Something Otto needs to act on: a review decision or a results-email request. */
export interface OttoNotification {
  id: string;
  requestId: string;
  type: "review.decided" | "results_email.requested";
  createdAt: string;
  data: Record<string, unknown>;
  ackedAt?: string;
}

/** A message sent through the contact form on the home page. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  createdAt: string;
}

export interface StoredFile {
  id: string;
  name: string; // stored filename on disk
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface WorkflowEvent {
  id: string;
  type: WorkflowEventType;
  at: string;
  /** Free-form note from Otto or the app. */
  detail?: string;
  version?: number;
  data?: Record<string, unknown>;
}

export interface HandoffAttempt {
  at: string;
  mode: "push" | "pull";
  ok: boolean;
  message: string;
}

export interface RequestRecord {
  id: string;
  /** Client-generated key so retries never create duplicate requests. */
  idempotencyKey: string;
  /** Secret held by the submitting browser; required to modify a draft. */
  draftToken: string;
  /** Capability token for the status and results pages. Unguessable; never listed publicly. */
  resultsToken: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  /** Optional. Only used to email the results, if the user asks for that. */
  email?: string;
  emailRequestedAt?: string;
  answers: Record<string, string>;
  /** The intake conversation as readable text ("Customer: …" / "Arkko: …"), when the brief came from the chat. */
  chatTranscript?: string;
  images: StoredFile[];
  assets: StoredFile[]; // files uploaded by Otto (result images, PDF)
  reviews: Review[];
  events: WorkflowEvent[];
  handoff: HandoffAttempt[];
  results?: ResultsVersion[];
}

export interface ResultsVersion {
  version: number;
  receivedAt: string;
  payload: ResultsPayload;
}

/* ------------------------------------------------------------------ */
/* Results contract (v1)                                               */
/* ------------------------------------------------------------------ */

/** sourced: backed by a cited source. interpretation: Otto's reading. assumption: needs validation. */
export type ClaimKind = "sourced" | "interpretation" | "assumption";

export interface ResultImage {
  /** Absolute URL, or `asset:<filename>` for a file uploaded via the assets endpoint. */
  src: string;
  alt: string;
  label?: string;
  /** True for generated or illustrative concept imagery. Rendered with a visible label. */
  illustrative?: boolean;
}

export interface Source {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  accessed?: string;
}

export interface Finding {
  id: string;
  title: string;
  summary: string;
  detail?: string;
  kind: ClaimKind;
  sourceIds?: string[];
  chartId?: string;
}

export interface Chart {
  id: string;
  title: string;
  type: "bar" | "line";
  unit: string; // e.g. "%", "USD m", "index"
  /** Category or x-axis label for each point. */
  points: { label: string; value: number }[];
  note?: string;
  sourceIds: string[];
}

export interface Competitor {
  name: string;
  brand?: string;
  image?: ResultImage;
  attributes: Record<string, string>;
  sourceIds?: string[];
}

export interface Risk {
  id: string;
  statement: string;
  kind: "assumption" | "risk" | "open_question";
  test?: string; // recommended validation
}

export interface ResultsPayload {
  schemaVersion: 1;
  client: { name: string; fictional?: boolean };
  project: {
    title: string;
    stage?: string; // e.g. "Exploratory"
  };
  concept: {
    eyebrow?: string;
    name: string;
    headline: string;
    proposition: string;
    image?: ResultImage;
    who?: string;
    when?: string;
    promise?: string;
  };
  pillars?: {
    label: string; // CONSUMER / CATEGORY / BRAND
    title: string;
    status: string; // "Hypothesis", "Qualitative assessment"...
    target: SectionId;
    linkLabel: string;
  }[];
  brief?: {
    summary: string;
    quotes?: string[];
    /** Intake image ids to show; defaults to all intake images. */
    imageIds?: string[];
    /** Additional or substitute images supplied by Otto. */
    images?: ResultImage[];
    transformation?: { from: string; to: string }[];
  };
  findings?: Finding[];
  charts?: Chart[];
  landscape?: {
    summary?: string;
    attributes: string[]; // column order
    competitors: Competitor[];
  };
  risks?: Risk[];
  nextTest?: { question: string; method?: string };
  sources?: Source[];
  deliverables?: {
    pdf?: string; // URL or asset:<filename>
    pdfLabel?: string;
  };
  disclaimer?: string;
}

export type SectionId =
  | "overview"
  | "brief"
  | "opportunity"
  | "landscape"
  | "risks"
  | "evidence";
