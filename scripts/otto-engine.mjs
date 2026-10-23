/**
 * Otto research engine: runs the Arkko skill team on an approved concept and publishes the results.
 *
 *   node --env-file=.env.local scripts/otto-engine.mjs --request req_123     # one request, then exit
 *   node --env-file=.env.local scripts/otto-engine.mjs --watch               # run on every new brief / approved concept
 *   ARKKO_URL=https://arkko-app.vercel.app node --env-file=.env.local scripts/otto-engine.mjs --watch
 *
 * Each skill file is the system prompt of a separate Claude call; the code runs the workflow the
 * coordinator skill describes:
 *   1. Coordinator writes the common research brief from the brief, idea and approved concept.
 *   2. Market, consumer and feasibility researchers run in parallel, with web search.
 *   3. Market, consumer and competitive evaluators run in parallel on all three research returns.
 *   4. Coordinator consolidates everything into Arkko's results format (no new interpretation).
 *   5. The results are published through Arkko's Otto API (PUT /results).
 *
 * The skill files are the project owner's and stay out of this repo: they are read from
 * ARKKO_SKILLS_DIR (default ~/Documents/Arkko-private-skills/v2-team). Every agent's full output is
 * saved under .otto-runs/<request id>/ for review. Needs OTTO_API_KEY and ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = (process.env.ARKKO_URL ?? "http://localhost:3000").replace(/\/$/, "");
const KEY = process.env.OTTO_API_KEY;
const SKILLS_DIR = process.env.ARKKO_SKILLS_DIR ?? path.join(os.homedir(), "Documents/Arkko-private-skills/v2-team");
const MODEL = "claude-opus-5-5";
const SEARCHES_PER_RESEARCHER = 6;
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
if (!KEY || !process.env.ANTHROPIC_API_KEY) {
  console.error("Set OTTO_API_KEY and ANTHROPIC_API_KEY (for example with --env-file=.env.local)");
  process.exit(1);
}

const claude = new Anthropic();
const log = (...a) => console.log(new Date().toLocaleTimeString(), ...a);
const usage = { input: 0, output: 0, searches: 0 };

const SKILLS = {
  coordinator: "arkko-idea-coordinator-SKILL.md",
  marketResearch: "arkko-idea-market research-SKILL.md",
  consumerResearch: "arkko-idea-Consumer research-SKILL.md",
  feasibilityResearch: "arkko-idea-commercial research-SKILL.md",
  marketEvaluation: "arkko-idea-Market attrac evaluation-SKILL.md",
  consumerEvaluation: "arkko-idea-Consumer fit evaluation-SKILL.md",
  competitiveEvaluation: "arkko-idea-Comp adv evaluation-SKILL.md",
};

const HOST_NOTE = `

## Host notes for this run
- You run inside Arkko's automated pipeline. Each specialist is a separate, real Claude call dispatched by the pipeline code; the coordinator does not dispatch agents itself.
- No user is available for questions. The customer already completed intake and approved the idea and concept. Record any undecided input as RESEARCH_QUESTION or UNRESOLVED instead of asking.
- This is a demo-scale run: work efficiently, keep returns focused and readable, and stop when searches become duplicative.`;

async function skill(name) {
  const text = await fs.readFile(path.join(SKILLS_DIR, SKILLS[name]), "utf8");
  return text + HOST_NOTE;
}

/* ------------------------------------------------------------------ */
/* Arkko's Otto API                                                     */
/* ------------------------------------------------------------------ */

async function otto(method, p, body) {
  const res = await fetch(`${BASE}/api/otto${p}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${p} → ${res.status} ${JSON.stringify(data.error ?? data).slice(0, 2000)} ${JSON.stringify(data.details ?? "").slice(0, 2000)}`);
  return data;
}

const latestOf = (req, stage) =>
  req.reviews.filter((r) => r.stage === stage).sort((a, b) => b.version - a.version)[0];

/* ------------------------------------------------------------------ */
/* Claude                                                               */
/* ------------------------------------------------------------------ */

/** One agent call. Streams so long research turns don't time out; resumes server-tool pauses. */
async function agent(label, system, content, { search = false, format } = {}) {
  const started = Date.now();
  const messages = [{ role: "user", content }];
  for (let turn = 0; turn < 4; turn++) {
    const stream = claude.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages,
      ...(search ? { tools: [{ type: "web_search_20260209", name: "web_search", max_uses: SEARCHES_PER_RESEARCHER }] } : {}),
      output_config: { effort: "medium", ...(format ? { format } : {}) },
    });
    const msg = await stream.finalMessage();
    usage.input += msg.usage.input_tokens ?? 0;
    usage.output += msg.usage.output_tokens ?? 0;
    usage.searches += msg.usage.server_tool_use?.web_search_requests ?? 0;
    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue;
    }
    if (msg.stop_reason === "refusal") throw new Error(`${label}: Claude declined`);
    if (msg.stop_reason === "max_tokens") throw new Error(`${label}: output cut off at max_tokens`);
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const sources = msg.content
      .filter((b) => b.type === "web_search_tool_result" && Array.isArray(b.content))
      .flatMap((b) => b.content.map((r) => ({ title: r.title, url: r.url })));
    log(`  ✓ ${label} (${Math.round((Date.now() - started) / 1000)}s)`);
    return { text, sources };
  }
  throw new Error(`${label}: did not finish`);
}

/* ------------------------------------------------------------------ */
/* The workflow                                                         */
/* ------------------------------------------------------------------ */

// Intake field ids (src/content/site.ts) as the research team should read them.
const ANSWER_LABELS = {
  brand: "Brand or business",
  goal: "Goal",
  product: "Product and format",
  audience: "Buyer and user",
  occasion: "Occasion and what it replaces",
  market: "Country or region",
  channels: "Channels",
  price: "Price and pack",
  ideas: "Early ideas",
  constraints: "Constraints",
};

function conceptText(req) {
  const a = req.answers ?? {};
  const idea = latestOf(req, "idea");
  const concept = latestOf(req, "concept");
  const fmt = (v) =>
    [v.title, v.summary, v.body, ...(v.highlights ?? []).map((h) => `${h.label}: ${h.value}`)].filter(Boolean).join("\n");
  return [
    `Project ID: ${req.id}`,
    concept
      ? `Concept ID: ${concept.id} (version ${concept.version}, approved by the customer)`
      : `Concept ID: ${req.id}-c1 (version 1). The customer's own idea from the intake below; there was no separate idea or concept round.`,
    "",
    "Customer brief (USER_CONFIRMED, from the intake):",
    ...Object.entries(a)
      .filter(([, v]) => v)
      .map(([k, v]) => `- ${ANSWER_LABELS[k] ?? k}: ${v}`),
    ...(req.chatTranscript ? ["", "Intake conversation (the customer's own words, USER_CONFIRMED):", req.chatTranscript] : []),
    ...(idea ? ["", `Approved idea:\n${fmt(idea)}`] : []),
    ...(concept ? ["", `Approved concept:\n${fmt(concept)}`] : []),
    "",
    "Decision to support: whether this concept is attractive enough to take into consumer validation, and what to test first.",
  ].join("\n");
}

// The shape the consolidation returns; toPayload() maps it to Arkko's results contract (src/lib/schema.ts).
const RESULTS_SHAPE = `{
  "projectTitle": string,
  "concept": { "eyebrow": string, "name": string, "headline": string, "proposition": string, "who": string, "when": string, "promise": string },
  "engines": [ { "engine": "market" | "momentum" | "consumer" | "whitespace", "score": number | null, "max": number, "status": string } ],
  "briefSummary": string,
  "transformation": [ { "from": string, "to": string } ],
  "findings": [ { "id": string, "title": string, "summary": string, "detail": string, "kind": "sourced" | "interpretation" | "assumption", "sourceIds": [string] } ],
  "charts": [ { "id": string, "findingId": string, "title": string, "type": "bar" | "line", "unit": string, "points": [ { "label": string, "value": number } ], "note": string, "sourceIds": [string] } ],
  "landscapeSummary": string,
  "landscapeAttributes": [string],
  "competitors": [ { "name": string, "brand": string, "attributes": [ { "attribute": string, "value": string } ], "sourceIds": [string] } ],
  "risks": [ { "id": string, "statement": string, "kind": "assumption" | "risk" | "open_question", "test": string } ],
  "nextTest": { "question": string, "method": string },
  "sources": [ { "id": string, "title": string, "url": string, "publisher": string } ]
}`;

const CONSOLIDATION_TASK = `Consolidate the research and evaluation returns above into Arkko's results showcase, following your coordinator rules: attribute faithfully, add no new interpretation, keep uncertainty visible.

Return ONLY one JSON object (no prose, no code fence) with this shape:
${RESULTS_SHAPE}

This JSON is shown to the customer on a polished results page, so write for a business reader:
- Plain English, short sentences, no markdown (no ** or bullet characters).
- Never show internal IDs or codes (E001, S003, R001, MKE-G004, CCE-K002, A4, V1, PR5, packet or rubric versions), agent letters ("Agent A") or workflow states (UNRESOLVED, NO_MATERIAL_CONCERN_FOUND). Say "the market research", "the consumer research", "the feasibility research" or "the evaluators" instead, and "not yet known" instead of UNRESOLVED.
- Keep uncertainty honest but brief: say once that something is unverified rather than repeating caveats in every field.

Fill the JSON fields:
- projectTitle: a short title, at most 6 words (for example "Campus iced tea opportunity").
- briefSummary: two or three sentences describing what the CUSTOMER asked for, in their terms, from the intake brief. Not the research or evaluation.
- transformation: up to three pairs showing how the customer's starting point became the concept.
- concept.who / when / promise: one short phrase each (at most 12 words), taken from the approved concept, or from the customer's own idea in the intake when there is no separate concept. concept.proposition: one or two sentences.
- concept: from the approved concept, or the customer's own idea when there is none; give it a short name (concept.name) that describes the product. eyebrow "Your next growth opportunity". headline is a short line from the concept, not a claim of success.
- engines: exactly four entries (market /30, momentum /25, consumer /25, whitespace /20) using the evaluators' scores. Use null when the evaluator did not score the engine or any component was not scoreable. status is a short label such as "Provisional · Medium confidence" or "Not scored · evidence gap".
- findings: the 6 most decision-relevant research findings; summary at most two sentences. kind "sourced" only when the finding cites at least one source id; specialist interpretations are "interpretation"; untested premises are "assumption". detail can be an empty string.
- charts: only where the research reports comparable numeric values with a cited source (same unit, at least 2 points). Otherwise return an empty array. Never invent or estimate numbers. findingId links the chart to the finding it supports (or empty string).
- competitors: 3 to 6 real competitors or substitutes from the research, with 3 to 5 shared attributes (landscapeAttributes) such as price, format, positioning, channel. Use the values the research reports; write "Not found" where it has none.
- risks: the 5 most important concerns, assumptions and open questions the evaluators raised, each one or two sentences, with the test that would resolve it in one sentence.
- nextTest: the first validation step the specialists proposed; method in at most two sentences.
- landscapeSummary: at most three sentences.
- sources: every source cited above, with sequential ids s1, s2, …, real titles and URLs from the research. Every sourceIds entry must refer to one of these ids.`;

/** Pull the JSON object out of a model reply, tolerating a stray code fence or sentence around it. */
function parseJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("the consolidation did not return JSON");
  return JSON.parse(text.slice(start, end + 1));
}

async function runEngine(req) {
  const dir = path.join(process.cwd(), ".otto-runs", req.id);
  await fs.mkdir(dir, { recursive: true });
  const save = (name, text) => fs.writeFile(path.join(dir, name), text);
  // With --resume, reuse the reports a previous run already saved instead of paying for them again.
  const resume = process.argv.includes("--resume");
  const step = async (file, run) => {
    if (resume) {
      const text = await fs.readFile(path.join(dir, file), "utf8").catch(() => undefined);
      if (text) {
        log(`  ↺ reused ${file}`);
        return { text, sources: [] };
      }
    }
    const out = await run();
    await save(file, out.text);
    return out;
  };
  const brand = req.answers?.brand ?? req.id;
  log(`Research engine starting for ${brand} (${req.id})`);
  await otto("POST", `/requests/${req.id}/events`, { type: "research_started", detail: "Otto research engine (Arkko skill team)" });

  const concept = conceptText(req);
  await save("0-concept.md", concept);

  log("Coordinator: writing the research brief…");
  const brief = await step("1-research-brief.md", async () =>
    agent("Coordinator · research brief", await skill("coordinator"),
      `${concept}\n\nThe customer completed intake through Arkko's chat or form; the answers and conversation are above. Review them as your intake (Section 5): record each material field in the input ledger with its status, and note gaps as RESEARCH_QUESTION since the customer cannot be asked now. Then produce the short concept summary and the common research brief (Section 7) with the three research assignments. Output the summary and brief only.`));

  log("Researchers: market, consumer and feasibility in parallel (with web search)…");
  const assignment = (owner) => `Common research brief\n\n${brief.text}\n\nYou are ${owner}. Complete your assignment from this brief and return your research submission with source records (title, publisher, URL), evidence and inference records, and your contribution to the coverage matrix.`;
  const [market, consumer, feasibility] = await Promise.all([
    step("2a-market-research.md", async () => agent("Market researcher", await skill("marketResearch"), assignment("arkko-market-research"), { search: true })),
    step("2b-consumer-research.md", async () => agent("Consumer researcher", await skill("consumerResearch"), assignment("arkko-consumer-research"), { search: true })),
    step("2c-feasibility-research.md", async () => agent("Feasibility researcher", await skill("feasibilityResearch"), assignment("arkko-feasibility-research"), { search: true })),
  ]);

  const packet = [
    `Common research brief\n\n${brief.text}`,
    `## Research return A: arkko-market-research\n\n${market.text}`,
    `## Research return B: arkko-consumer-research\n\n${consumer.text}`,
    `## Research return C: arkko-feasibility-research\n\n${feasibility.text}`,
  ].join("\n\n---\n\n");

  log("Evaluators: market, consumer and competitive in parallel…");
  const evaluation = (owner) => `${packet}\n\n---\n\nEvaluation policy: default weights Structural 30, Cultural 25, Consumer Fit 25, White Space 20.\nYou are ${owner}. Evaluate your owned components and gates from the full evidence above and return your evaluation submission.`;
  const [marketEval, consumerEval, competitiveEval] = await Promise.all([
    step("3a-market-evaluation.md", async () => agent("Market evaluator", await skill("marketEvaluation"), evaluation("arkko-market-evaluation"))),
    step("3b-consumer-evaluation.md", async () => agent("Consumer evaluator", await skill("consumerEvaluation"), evaluation("arkko-consumer-evaluation"))),
    step("3c-competitive-evaluation.md", async () => agent("Competitive evaluator", await skill("competitiveEvaluation"), evaluation("arkko-competitive-commercial-evaluation"))),
  ]);

  log("Coordinator: consolidating into the results showcase…");
  const searched = [...market.sources, ...consumer.sources, ...feasibility.sources];
  const consolidated = await step("4-consolidated.json", async () =>
    agent("Coordinator · consolidation", await skill("coordinator"), [
      packet,
      `## Evaluation return D: arkko-market-evaluation\n\n${marketEval.text}`,
      `## Evaluation return E: arkko-consumer-evaluation\n\n${consumerEval.text}`,
      `## Evaluation return F: arkko-competitive-commercial-evaluation\n\n${competitiveEval.text}`,
      ...(searched.length ? [`## Pages the researchers retrieved\n${searched.map((s) => `- ${s.title}: ${s.url}`).join("\n")}`] : []),
      CONSOLIDATION_TASK,
    ].join("\n\n---\n\n")));

  const payload = toPayload(req, parseJson(consolidated.text));
  await save("5-results-payload.json", JSON.stringify(payload, null, 2));
  const published = await otto("PUT", `/requests/${req.id}/results`, payload);
  log(`Published results v${published.version}: ${published.resultsUrl}`);
  log(`Agent reports saved in ${path.relative(process.cwd(), dir)}/`);
}

/** Customer-facing text: no markdown emphasis and no internal record codes such as "(CCE-K002; MKE-G004)". */
const CODE = /\b[A-Z]{1,4}-[A-Z]{0,2}\d{2,4}\b/;
function tidy(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(new RegExp(`\\s*\\([^()]*${CODE.source}[^()]*\\)`, "g"), "")
    .replace(new RegExp(CODE.source, "g"), "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
const tidyAll = (v, key) =>
  typeof v === "string" ? (["id", "url", "sourceIds", "chartId", "target", "src"].includes(key) ? v : tidy(v))
  : Array.isArray(v) ? v.map((x) => tidyAll(x, key))
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, tidyAll(x, k)]))
  : v;

/** Map the consolidation to Arkko's ResultsPayload, dropping anything that would break its integrity rules. */
function toPayload(req, consolidated) {
  const empty = { engines: [], transformation: [], findings: [], charts: [], landscapeAttributes: [], competitors: [], risks: [], sources: [] };
  const c = tidyAll({ ...empty, ...consolidated });
  const sources = c.sources.filter((s) => s.id && s.title).map((s) => ({
    id: s.id,
    title: s.title,
    ...(/^https?:\/\//.test(s.url) ? { url: s.url } : {}),
    ...(s.publisher ? { publisher: s.publisher } : {}),
    accessed: new Date().toISOString().slice(0, 10),
  }));
  const ids = new Set(sources.map((s) => s.id));
  const refs = (list) => (list ?? []).filter((id) => ids.has(id));

  const charts = c.charts
    .map((ch) => ({ ...ch, sourceIds: refs(ch.sourceIds), points: ch.points.filter((p) => Number.isFinite(p.value)) }))
    .filter((ch) => ch.sourceIds.length && ch.points.length >= 2);
  const chartIds = new Set(charts.map((ch) => ch.id));
  const chartFor = (findingId) => charts.find((ch) => ch.findingId === findingId)?.id;

  const findings = c.findings.map((f) => {
    const sourceIds = refs(f.sourceIds);
    const kind = f.kind === "sourced" && !sourceIds.length ? "interpretation" : f.kind;
    const chartId = chartFor(f.id);
    return {
      id: f.id,
      title: f.title,
      summary: f.summary,
      ...(f.detail ? { detail: f.detail } : {}),
      kind,
      ...(sourceIds.length ? { sourceIds } : {}),
      ...(chartId && chartIds.has(chartId) ? { chartId } : {}),
    };
  });

  const ENGINES = {
    market: { label: "Market", title: "Structural market attractiveness", target: "landscape", max: 30 },
    momentum: { label: "Momentum", title: "Cultural momentum", target: "opportunity", max: 25 },
    consumer: { label: "Consumer", title: "Consumer problem–solution fit", target: "opportunity", max: 25 },
    whitespace: { label: "White space", title: "Competitive white-space advantage", target: "landscape", max: 20 },
  };
  const pillars = ["market", "momentum", "consumer", "whitespace"].map((key) => {
    const e = c.engines.find((x) => x.engine === key);
    const meta = ENGINES[key];
    const scored = typeof e?.score === "number";
    const score = scored ? `${Math.round(e.score * 10) / 10} / ${meta.max}` : "Not scored yet";
    // Card labels stay short: the evaluator's first clause (e.g. "Provisional", "evidence gap").
    const note = (e?.status ?? "").split(/[.;]/)[0].split("·").map((s) => s.trim()).filter((s) => s && !/^not scored$/i.test(s)).pop();
    const status = [score, note ?? (scored ? "" : "Evidence gap")].filter(Boolean).join(" · ").slice(0, 60);
    return { label: meta.label, title: meta.title, status, target: meta.target, linkLabel: "View evidence" };
  });

  return {
    schemaVersion: 1,
    client: { name: req.answers?.brand ?? "Your brand" },
    project: { title: c.projectTitle, stage: "Desk research · AI specialist team" },
    concept: {
      eyebrow: c.concept.eyebrow,
      name: c.concept.name,
      headline: c.concept.headline,
      proposition: c.concept.proposition,
      who: c.concept.who,
      when: c.concept.when,
      promise: c.concept.promise,
    },
    pillars,
    brief: {
      summary: c.briefSummary,
      ...(req.images?.length ? { imageIds: req.images.map((i) => i.id) } : {}),
      ...(c.transformation.length ? { transformation: c.transformation.slice(0, 4) } : {}),
    },
    findings,
    ...(charts.length
      ? {
          charts: charts.map((ch) => ({
            id: ch.id,
            title: ch.title,
            type: ch.type,
            unit: ch.unit,
            points: ch.points,
            sourceIds: ch.sourceIds,
            ...(ch.note ? { note: ch.note } : {}),
          })),
        }
      : {}),
    ...(c.competitors.length
      ? {
          landscape: {
            summary: c.landscapeSummary,
            attributes: c.landscapeAttributes,
            competitors: c.competitors.map((comp) => ({
              name: comp.name,
              ...(comp.brand ? { brand: comp.brand } : {}),
              attributes: Object.fromEntries(comp.attributes.map((a) => [a.attribute, a.value])),
              ...(refs(comp.sourceIds).length ? { sourceIds: refs(comp.sourceIds) } : {}),
            })),
          },
        }
      : {}),
    risks: c.risks.map((r) => ({ id: r.id, statement: r.statement, kind: r.kind, ...(r.test ? { test: r.test } : {}) })),
    ...(c.nextTest?.question ? { nextTest: { question: c.nextTest.question, ...(c.nextTest.method ? { method: c.nextTest.method } : {}) } } : {}),
    sources,
    disclaimer: "Desk research and evaluation by Arkko's AI specialist team. Scores are an attractiveness index, not a probability of success.",
  };
}

/* ------------------------------------------------------------------ */
/* Entry points                                                         */
/* ------------------------------------------------------------------ */

/** Research runs on a brief with no idea/concept rounds, or once the concept is approved. */
function ready(req) {
  if (req.results?.length) return false;
  if (!req.reviews.length) return true;
  return latestOf(req, "concept")?.decision?.type === "approved";
}

async function runFor(id) {
  const { request: req } = await otto("GET", `/requests/${id}`);
  if (!ready(req)) throw new Error(`${id}: not ready for research (needs a submitted brief, or an approved concept)`);
  await otto("POST", `/requests/${id}/ack`).catch(() => {});
  await runEngine(req);
  log(`Usage: ${usage.input.toLocaleString()} input tokens, ${usage.output.toLocaleString()} output tokens, ${usage.searches} web searches`);
}

const one = arg("--request");
if (one) {
  await runFor(one).catch(async (err) => {
    log(`Failed: ${err.message}`);
    await otto("POST", `/requests/${one}/events`, { type: "error", detail: `Research engine: ${err.message}`.slice(0, 2000) }).catch(() => {});
    process.exitCode = 1;
  });
} else if (process.argv.includes("--watch")) {
  // New briefs are picked up from the queue; --all also includes briefs submitted before the watch started.
  const since = process.argv.includes("--all") ? "" : new Date().toISOString();
  log(`Watching ${BASE} for new briefs and approved concepts${since ? " (from now on)" : " (including older briefs)"}. Ctrl+C to stop.`);
  for (;;) {
    try {
      const { requests } = await otto("GET", "/requests");
      for (const r of requests) {
        if ((r.submittedAt ?? "") < since || r.reviews.length) continue;
        await runFor(r.id).catch((err) => log(`Failed for ${r.id}: ${err.message}`));
      }
      const { notifications } = await otto("GET", "/notifications");
      for (const n of notifications) {
        if (n.type !== "review.decided" || n.data.stage !== "concept" || n.data.decision !== "approved") continue;
        await otto("POST", `/notifications/${n.id}/ack`);
        await runFor(n.requestId).catch((err) => log(`Failed for ${n.requestId}: ${err.message}`));
      }
    } catch (err) {
      log(`Error: ${err.message}. Will retry.`);
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
} else {
  console.log("Use --request <id> to run once, or --watch to run on every new brief and approved concept.");
}
