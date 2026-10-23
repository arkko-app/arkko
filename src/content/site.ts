/**
 * Placeholder copy and intake definitions.
 * The project owner's final copy and questions drop in here — no layout changes needed.
 */

export const site = {
  name: "arkko",
  tagline: "Build your insurgent advantage.",
  hero: {
    eyebrow: "Growth opportunities, developed",
    title: "From a rough brief to a researched opportunity.",
    body: "Tell Arkko what you're trying to grow. We shape it into an idea, then a concept, you approve each one on your request page, and we back the result with live research.",
    /** Every "Talk to Arkko" button starts the intake. */
    cta: "Talk to Arkko",
    secondary: "See an example",
  },
  offering: [
    {
      label: "Idea",
      title: "A sharp starting point",
      body: "Your input becomes a first idea. Approve it, or tell us what to change, until it's right.",
    },
    {
      label: "Concept",
      title: "A developed concept",
      body: "The approved idea becomes a fuller concept: who it's for, when it matters, and what it promises.",
    },
    {
      label: "Evidence",
      title: "A research-backed case",
      body: "Live research and analysis test the opportunity — with sources, risks, and what to validate next.",
    },
  ],
  process: [
    { step: "01", title: "Share your brief", body: "Answer a few questions and add any images that help." },
    { step: "02", title: "Approve the idea", body: "A first idea appears on your request page. Approve it or ask for changes." },
    { step: "03", title: "Approve the concept", body: "We develop the concept and refine it with you, on the same page." },
    { step: "04", title: "Explore the results", body: "An interactive results page and PDF brief. We can email them to you too." },
  ],
  closing: {
    title: "Ready to find your next opportunity?",
    body: "It takes about five minutes. Then follow along and approve each step from your request page.",
  },
  intake: {
    chooseTitle: "How would you like to share your brief?",
    chooseBody: "Both take about five minutes and end in the same place. You can switch at any time.",
    chat: {
      label: "Chat with Arkko",
      body: "Answer in your own words. Arkko asks a few questions and writes up the brief for you to check.",
    },
    form: {
      label: "Fill in a form",
      body: "Five short questions on one page. Best if you already know what you want to say.",
    },
    greeting: "Hi, I’m Arkko. Which brand or business are we talking about today?",
    /** One-tap replies shown under Arkko's questions in the chat. */
    quickReplies: ["Skip this one", "I’m not sure yet", "That’s everything"],
    /** Replies used when the chat runs without Claude (no API key): it asks the intake questions in order. */
    guided: {
      acks: ["Thanks.", "Got it.", "Great.", "Noted."],
      required: "I do need this one to get started.",
      beforeWrapUp: "Before we wrap up, I just need one more thing.",
      done: "Thanks, here’s your brief. Have a look before we continue.",
    },
  },
};

export type IntakeField = {
  id: string;
  label: string;
  help?: string;
  placeholder?: string;
  type: "text" | "textarea";
  required?: boolean;
  maxLength: number;
};

export const intakeFields: IntakeField[] = [
  {
    id: "brand",
    label: "Which brand or business is this for?",
    placeholder: "e.g. VELA Beverages",
    type: "text",
    required: true,
    maxLength: 120,
  },
  {
    id: "goal",
    label: "What are you trying to grow or solve?",
    help: "A sentence or two is plenty.",
    placeholder: "e.g. We want a foothold in the afternoon drinks occasion without competing head-on with energy drinks.",
    type: "textarea",
    required: true,
    maxLength: 2000,
  },
  {
    id: "product",
    label: "What is the product?",
    help: "The category and format, for example a canned drink or a snack bar. Rough is fine.",
    placeholder: "e.g. A sparkling botanical drink in a 330 ml can.",
    type: "textarea",
    maxLength: 1000,
  },
  {
    id: "audience",
    label: "Who do you want to reach?",
    placeholder: "e.g. Office workers who want a lift after lunch but find energy drinks too much.",
    type: "textarea",
    maxLength: 1500,
  },
  {
    id: "occasion",
    label: "When would people use it, and what would it replace?",
    placeholder: "e.g. The mid-afternoon break, instead of a coffee or an energy drink.",
    type: "textarea",
    maxLength: 1000,
  },
  {
    id: "market",
    label: "Which country or region?",
    placeholder: "e.g. United Kingdom",
    type: "text",
    maxLength: 200,
  },
  {
    id: "channels",
    label: "Where would it be sold?",
    help: "Shops, online, cafés, venues… whatever you have in mind.",
    placeholder: "e.g. Supermarkets and convenience stores, then online.",
    type: "textarea",
    maxLength: 1000,
  },
  {
    id: "price",
    label: "What price and pack size are you thinking of?",
    help: "A rough range is fine, or say it's not decided yet.",
    placeholder: "e.g. About £1.80 for a single can.",
    type: "text",
    maxLength: 300,
  },
  {
    id: "ideas",
    label: "Any early ideas, territories, or references?",
    help: "Half-formed is fine.",
    type: "textarea",
    maxLength: 2000,
  },
  {
    id: "constraints",
    label: "Anything we should know — constraints, markets, timing?",
    type: "textarea",
    maxLength: 1500,
  },
];
