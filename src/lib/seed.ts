import type { RequestRecord, ResultsPayload, Review } from "./types";

/** Known links for the conference demo. */
export const DEMO_TOKEN = "vela-demo"; // finished results
export const DEMO_REVIEW_TOKEN = "vela-review"; // concept waiting for approval

export const velaResults: ResultsPayload = {
  schemaVersion: 1,
  client: { name: "VELA", fictional: true },
  project: { title: "Afternoon Beverage Opportunity", stage: "Exploratory" },
  concept: {
    eyebrow: "Your next growth opportunity",
    name: "Arkko Botanicals",
    headline: "Own the afternoon reset.",
    proposition: "A refreshing alternative to high-intensity energy drinks.",
    image: {
      src: "/demo/vela-concept.svg",
      alt: "Illustrated can of a citrus-botanical sparkling drink with grapefruit and strawberry",
      label: "Illustrative concept · Not final packaging",
      illustrative: true,
    },
    who: "Afternoon refreshment seekers",
    when: "The afternoon pause",
    promise: "Refreshment, not intensity",
  },
  pillars: [
    { label: "Consumer", title: "A distinct afternoon occasion", status: "Hypothesis", target: "opportunity", linkLabel: "View evidence" },
    { label: "Category", title: "A territory to investigate", status: "Qualitative assessment", target: "landscape", linkLabel: "View landscape" },
    { label: "Brand", title: "A direction to assess", status: "Fit not yet validated", target: "brief", linkLabel: "View rationale" },
  ],
  brief: {
    summary:
      "VELA asked for a foothold in afternoon drinks without competing head-on with energy brands. The brief named office workers who want a lift after lunch but find energy drinks ‘too much’.",
    quotes: [
      "We want to own a moment in the day, not just a shelf.",
      "Something with energy-drink convenience but none of the edge.",
    ],
    images: [
      { src: "/demo/brief-moodboard.svg", alt: "Submitted moodboard of citrus colours and botanical leaves", label: "Submitted by VELA · Moodboard" },
      { src: "/demo/brief-shelf.svg", alt: "Submitted sketch of a chilled shelf with slim cans", label: "Submitted by VELA · Shelf reference" },
    ],
    transformation: [
      { from: "A drink for the afternoon", to: "A ritual for the afternoon reset" },
      { from: "Less intense than energy drinks", to: "Refreshment, not intensity" },
      { from: "Office workers", to: "Afternoon refreshment seekers" },
    ],
  },
  findings: [
    {
      id: "f1",
      title: "The afternoon is a recognised slump",
      summary: "In the illustrative survey, mid-afternoon is the most-cited low-energy moment of the working day.",
      detail: "Respondents were asked when they most often reach for a drink to ‘reset’. The 2–4pm window led every other daypart.",
      kind: "sourced",
      sourceIds: ["s1"],
      chartId: "c1",
    },
    {
      id: "f2",
      title: "Energy drinks feel like too much for many",
      summary: "A share of lapsed energy-drink buyers cite intensity, not taste, as the reason they stopped.",
      kind: "sourced",
      sourceIds: ["s2"],
      chartId: "c2",
    },
    {
      id: "f3",
      title: "Botanicals signal ‘lighter’ without signalling ‘weaker’",
      summary: "Our reading of category language: citrus and botanical cues read as refreshing and adult rather than diluted.",
      kind: "interpretation",
      sourceIds: ["s3"],
    },
    {
      id: "f4",
      title: "Buyers will treat the afternoon as its own occasion",
      summary: "The concept depends on people choosing a drink for the afternoon specifically. This has not been tested.",
      kind: "assumption",
    },
  ],
  charts: [
    {
      id: "c1",
      title: "When people most want a ‘reset’ drink",
      type: "bar",
      unit: "% of respondents",
      points: [
        { label: "Morning", value: 22 },
        { label: "Lunch", value: 14 },
        { label: "2–4pm", value: 41 },
        { label: "Evening", value: 23 },
      ],
      note: "Illustrative data for the fictional demo.",
      sourceIds: ["s1"],
    },
    {
      id: "c2",
      title: "Lapsed energy-drink buyers citing intensity",
      type: "line",
      unit: "% of lapsed buyers",
      points: [
        { label: "2022", value: 28 },
        { label: "2023", value: 31 },
        { label: "2024", value: 35 },
        { label: "2025", value: 38 },
      ],
      note: "Illustrative data for the fictional demo.",
      sourceIds: ["s2"],
    },
  ],
  landscape: {
    summary:
      "The space between soft drinks and energy drinks is crowded at the extremes and thin in the middle. Most functional sodas lead with gut health; few lead with the moment.",
    attributes: ["Positioning", "Caffeine", "Occasion", "Tone"],
    competitors: [
      {
        name: "High-intensity energy",
        brand: "Category leaders",
        attributes: { Positioning: "Performance, stamina", Caffeine: "High", Occasion: "Any time, late night", Tone: "Loud, extreme" },
        sourceIds: ["s3"],
      },
      {
        name: "Functional soda",
        brand: "Gut-health challengers",
        attributes: { Positioning: "Wellness, digestion", Caffeine: "None", Occasion: "With meals", Tone: "Bright, playful" },
        sourceIds: ["s3"],
      },
      {
        name: "Iced coffee RTD",
        brand: "Coffee brands",
        attributes: { Positioning: "Indulgent pick-me-up", Caffeine: "Medium–high", Occasion: "Morning, commute", Tone: "Café, comforting" },
        sourceIds: ["s3"],
      },
      {
        name: "Arkko Botanicals",
        brand: "Concept",
        attributes: { Positioning: "Afternoon reset", Caffeine: "Light (proposed)", Occasion: "2–4pm pause", Tone: "Crisp, adult, bright" },
      },
    ],
  },
  risks: [
    { id: "r1", kind: "assumption", statement: "The afternoon is a buying occasion, not just a mood.", test: "Occasion-led concept test against a generic ‘light energy’ framing." },
    { id: "r2", kind: "risk", statement: "‘Light caffeine’ may read as ‘weak’ next to energy drinks.", test: "Claims test of ‘refreshment, not intensity’ with lapsed energy buyers." },
    { id: "r3", kind: "open_question", statement: "Does the Arkko name stretch from VELA’s existing portfolio?", test: "Brand-fit interviews with current VELA buyers." },
  ],
  nextTest: {
    question: "Does the occasion motivate purchase?",
    method: "Monadic concept test, n≈300 afternoon drinkers, occasion framing vs. product framing.",
  },
  sources: [
    { id: "s1", title: "Afternoon drinking occasions survey (illustrative)", publisher: "Fictional research panel", accessed: "2026-10-12" },
    { id: "s2", title: "Energy-drink lapse reasons tracker (illustrative)", publisher: "Fictional category report", accessed: "2026-10-12" },
    { id: "s3", title: "Functional beverage shelf and claims audit (illustrative)", publisher: "Otto desk research (fictional)", accessed: "2026-10-13" },
  ],
  deliverables: { pdf: "/demo/vela-brief.pdf", pdfLabel: "Download brief" },
  disclaimer: "Illustrative demo · Findings and concepts are fictional",
};

const velaAnswers = {
  brand: "VELA",
  goal: "We want a foothold in the afternoon drinks occasion without competing head-on with energy drinks.",
  audience: "Office workers who want a lift after lunch but find energy drinks too much.",
};

const ideaV1: Review = {
  id: "rev_vela_idea_1",
  stage: "idea",
  version: 1,
  createdAt: "2026-10-12T16:00:00.000Z",
  title: "A lighter energy drink",
  summary: "A lower-caffeine energy drink in VELA's existing style, positioned as the sensible choice.",
  body: "Lead with reduced caffeine and a cleaner ingredient list. Sit next to energy drinks on shelf and win the buyers who find them too much.",
  decision: {
    type: "changes_requested",
    feedback: "Feels like a weaker energy drink. Can it be about the moment in the day instead of the caffeine?",
    at: "2026-10-12T17:10:00.000Z",
  },
};

const ideaV2: Review = {
  id: "rev_vela_idea_2",
  stage: "idea",
  version: 2,
  createdAt: "2026-10-12T17:40:00.000Z",
  title: "Own the afternoon reset",
  summary: "A drink built for the 2–4pm slump: refreshment, not intensity.",
  body: "Instead of competing on caffeine, claim the afternoon as an occasion. Bright citrus and botanicals, a light lift, and a ritual people choose for that moment in the day.",
  highlights: [
    { label: "Who", value: "Afternoon refreshment seekers" },
    { label: "When", value: "The afternoon pause" },
  ],
  decision: { type: "approved", at: "2026-10-12T18:00:00.000Z" },
};

const conceptV1: Review = {
  id: "rev_vela_concept_1",
  stage: "concept",
  version: 1,
  createdAt: "2026-10-13T09:00:00.000Z",
  title: "Arkko Botanicals",
  summary: "A functional citrus-botanical sparkling drink for the afternoon reset.",
  body: "Slim can, bitter-and-bright flavour profile, light caffeine from green tea. The brand voice is crisp and adult, closer to an aperitif than an energy drink.\n\nLaunch flavours: grapefruit & strawberry, yuzu & basil.",
  highlights: [
    { label: "Who", value: "Afternoon refreshment seekers" },
    { label: "When", value: "The afternoon pause" },
    { label: "Proposition", value: "Refreshment, not intensity" },
  ],
  image: velaResults.concept.image,
};

export function seedRecords(): RequestRecord[] {
  const at = "2026-10-12T15:00:00.000Z";
  const base = {
    draftToken: "seed",
    status: "results_ready" as const,
    createdAt: at,
    updatedAt: at,
    submittedAt: at,
    answers: velaAnswers,
    images: [],
    assets: [],
    handoff: [{ at, mode: "pull" as const, ok: true, message: "Seeded demo" }],
  };
  return [
    {
      ...base,
      id: "req_demo_vela",
      idempotencyKey: "seed-vela",
      resultsToken: DEMO_TOKEN,
      reviews: [ideaV1, ideaV2, { ...conceptV1, decision: { type: "approved", at: "2026-10-13T12:00:00.000Z" } }],
      events: [
        { id: "ev1", type: "received", at },
        { id: "ev2", type: "research_started", at: "2026-10-13T12:05:00.000Z" },
        { id: "ev3", type: "results_published", at: "2026-10-13T16:00:00.000Z", version: 1 },
      ],
      results: [{ version: 1, receivedAt: "2026-10-13T16:00:00.000Z", payload: velaResults }],
    },
    {
      ...base,
      id: "req_demo_vela_review",
      idempotencyKey: "seed-vela-review",
      resultsToken: DEMO_REVIEW_TOKEN,
      status: "in_progress",
      reviews: [ideaV1, ideaV2, conceptV1],
      events: [{ id: "ev1", type: "received", at }],
    },
  ];
}
