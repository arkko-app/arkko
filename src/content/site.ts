/**
 * Placeholder copy and intake definitions.
 * The project owner's final copy and questions drop in here — no layout changes needed.
 */

export const site = {
  name: "arkko",
  tagline: "Build your insurgent advantage.",
  /** Home page copy, from the project owner's design (Oct 2026). Bracketed text is a placeholder awaiting real content. */
  home: {
    cta: "Talk to arkko",
    nav: [
      { href: "#why", label: "Why arkko" },
      { href: "#get", label: "What you get" },
      { href: "#how", label: "How it works" },
      { href: "#example", label: "Example" },
    ],
    hero: {
      title: "Your innovation AI. Built for your insurgent advantage.",
      lead: "Your ideas. Supercharged.",
      body: "A purpose-built innovation AI to sharpen your thinking, pressure-test potential, and focus your next investment.",
      secondary: "Explore an example",
    },
    why: {
      eyebrow: "Why arkko",
      title: "AI is the engine. CPG experience shapes the approach.",
      body: [
        "arkko’s frameworks were developed through more than 20 years of CPG innovation experience. They guide how an idea is defined, which questions are examined, and how its strengths, risks, and unanswered questions are assessed.",
        "You bring your idea and business context. arkko brings a structured approach to working through the opportunity.",
      ],
      points: [
        { title: "The questions to ask", body: "Bring structure to the consumer need, proposition, and reasons someone would choose the idea." },
        { title: "The assumptions to examine", body: "Make the underlying thinking visible so it can be discussed and challenged." },
        { title: "The next questions to resolve", body: "Identify where more evidence or testing is needed before advancing." },
      ],
    },
    gain: {
      eyebrow: "What you gain",
      title: "A clearer idea. A better-informed next move.",
      cards: [
        { title: "Sharpen the proposition", body: "Turn an early thought into an idea your team can understand, examine, and refine.", tone: "pistachio" },
        { title: "Challenge the assumptions", body: "Bring weaknesses and uncertainties into the conversation alongside the opportunity.", tone: "pomelo" },
        { title: "Focus the next investment", body: "Identify what needs further investigation before committing more time and resources.", tone: "amber" },
        { title: "Create a shared basis for discussion", body: "Give your team a structured idea and evaluation to work from.", tone: "sand" },
      ],
    },
    categories: ["Beverage opportunities", "Food & snack opportunities", "Flavor & format exploration"],
    get: {
      eyebrow: "What you get",
      title: "From an early idea to a structured assessment.",
      items: [
        { title: "A structured idea", body: "Clarify who it is for, the need it addresses, what it offers, and why someone would choose it." },
        { title: "A framework-led evaluation", body: "Examine the idea’s potential through arkko’s CPG innovation frameworks, with its strengths, weaknesses, and assumptions brought into view." },
        { title: "Priorities for validation", body: "Understand the unresolved questions and what needs further investigation before moving forward." },
      ],
    },
    example: {
      eyebrow: "Example",
      title: "See what arkko brings to the idea.",
      body: "Explore a sample structured idea and evaluation—from the initial proposition to the questions that need answering next.",
      note: "Illustrative example · fictional brand · no consumer testing conducted",
      fullLink: "View the full sample evaluation",
      tabs: { idea: "The starting idea", structured: "How arkko structured it", evaluation: "The evaluation", validate: "What to validate next" },
      idea: {
        label: "The starting idea, as submitted",
        quote: "A lighter afternoon drink for people who want a lift without reaching for an energy drink.",
        context: "Brand: VELA, a challenger beverage brand. Context: looking for a new occasion beyond morning coffee alternatives.",
        asideTitle: "Where most ideas start",
        aside: "A promising instinct, but the consumer, the need and the reason to switch are still implicit. That is what arkko structures next.",
      },
      structured: {
        label: "Structured idea",
        title: "Own the afternoon reset.",
        sticker: "A clearer proposition",
        fields: [
          { label: "Who it’s for", value: "Office-based adults who reach for a second coffee or an energy drink mid-afternoon." },
          { label: "The need", value: "A lift to finish the day that doesn’t leave them wired or crashing by evening." },
          { label: "What it offers", value: "A lightly caffeinated, sparkling citrus-botanical drink made for the afternoon pause." },
          { label: "Why they’d choose it", value: "Refreshment and focus without the intensity, or the image, of an energy drink." },
        ],
      },
      evaluation: {
        label: "Framework-led evaluation",
        summary: "The opportunity is clear and specific. Its case rests on one belief that hasn’t been tested.",
        sticker: "An assumption worth challenging",
        items: [
          { kind: "Strength", title: "A specific occasion", body: "The afternoon pause is easy to picture and gives the brand a moment to own, rather than a generic “better-for-you” claim.", tone: "pistachio" },
          { kind: "Weakness", title: "A crowded shelf", body: "Functional sparkling drinks already compete for this moment, so differentiation depends on the “reset” positioning holding up.", tone: "pomelo" },
          { kind: "Assumption", title: "Less is more", body: "The idea assumes afternoon drinkers want less stimulation, not simply a better-tasting version of what they already buy.", tone: "amber" },
        ],
      },
      validate: {
        label: "Priorities for validation",
        summary: "What to resolve before committing more time and resources. The decision to advance, revise, pause or stop stays with your team.",
        sticker: "Validate before advancing",
        items: [
          { priority: "Test demand", question: "Do afternoon energy-drink buyers see “less intense” as a benefit, or as a compromise?" },
          { priority: "Confirm feasibility", question: "Can a citrus-botanical profile taste right at low sugar and light caffeine?" },
          { priority: "Examine economics", question: "Can it sit at a price that competes with the second coffee it aims to replace?" },
        ],
      },
    },
    how: {
      eyebrow: "How it works",
      title: "Start with your idea. Stay involved as it takes shape.",
      steps: [
        { title: "Share your brief", body: "Tell arkko about your idea, brand, business context, and constraints." },
        { title: "Review the structured idea", body: "Clarify the proposition and refine the direction." },
        { title: "Explore the evaluation", body: "Review the idea’s strengths, weaknesses, assumptions, and open questions." },
        { title: "Plan what to validate next", body: "Use the assessment to guide further investigation and discussion." },
      ],
    },
    founder: {
      eyebrow: "The experience behind it",
      title: "Built from CPG innovation experience.",
      body: "arkko’s frameworks were developed through more than 20 years of CPG innovation experience—bringing an experienced approach to how brands structure and assess new ideas.",
      name: "Pedro Merizalde",
      photo: "[Founder photograph]",
      bio: "[Approved biography: relevant roles, categories and areas of innovation experience that can be publicly substantiated]",
      proof: "[Authorized company logos or testimonials, if available]",
    },
    faq: {
      title: "Questions, answered plainly.",
      items: [
        { q: "Why use arkko instead of a general AI tool?", a: "arkko provides a purpose-built approach to structuring and evaluating CPG innovation ideas. Its experience-developed frameworks guide the questions, assessment, and output, so you do not have to design the process from scratch." },
        { q: "What can I use arkko for today?", a: "arkko currently supports idea structuring and evaluation. Its broader ambition is to support more of the innovation journey over time." },
        { q: "Does an evaluation prove that an idea will succeed?", a: "No. An evaluation helps you understand an idea’s potential, assumptions, and unanswered questions. It does not replace consumer testing, technical development, or commercial validation." },
        { q: "What do I need to get started?", a: "[Answer from the real intake requirements]" },
        { q: "Who owns my ideas, and how is my information handled?", a: "[Answer after reviewing the actual terms, provider agreements and data-handling practices]" },
      ],
    },
    closing: {
      title: "Give your next idea a more experienced starting point.",
      body: "Structure the proposition, examine its potential, and understand what needs validating next.",
    },
    footer: "The innovation partner for ambitious CPG brands.",
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
