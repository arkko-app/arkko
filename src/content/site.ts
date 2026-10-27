/**
 * Placeholder copy and intake definitions.
 * The project owner's final copy and questions drop in here — no layout changes needed.
 */

export const site = {
  name: "arkko",
  tagline: "Build your insurgent advantage.",
  /** Home page copy, from the project owner's design and copy changes (Oct 2026). */
  home: {
    /** Main call to action: leads to the contact form. */
    cta: "Talk to arkko",
    /** Second call to action: try arkko by giving a brief (chat or form). */
    demo: "Demo",
    nav: [
      { href: "#why", label: "Why Arkko" },
      { href: "#get", label: "What you get" },
      { href: "#how", label: "How it works" },
      { href: "#example", label: "Example" },
    ],
    hero: {
      eyebrow: "Your AI-powered innovation partner",
      title: "Which ideas deserve your next investment?",
      body: "Arkko helps food and beverage teams turn early ideas into clear propositions, research their potential, and evaluate the evidence—so your team can decide what to advance, investigate further, or park.",
    },
    why: {
      eyebrow: "Why Arkko",
      title: "Powered by AI. Grounded in 20+ years of CPG innovation experience.",
      body: [
        "Arkko’s frameworks turn CPG innovation experience into a structured approach to researching and evaluating your idea, from consumer needs and market conditions to competition and commercial requirements.",
        "The assessment brings together supporting evidence, findings that challenge your assumptions, and questions that still need answers. Your team brings the brand and category expertise to interpret what it means.",
      ],
      points: [
        { title: "The questions that matter", body: "Examine consumer demand, market attractiveness, competitive advantage, and the practical requirements of bringing the idea to market." },
        { title: "Evidence, not just confirmation", body: "Explore what supports the idea and what challenges it, with sources and reasoning behind the assessment." },
        { title: "Clarity about what’s unknown", body: "See where evidence is limited, conclusions are provisional, and further research or testing is needed." },
      ],
    },
    gain: {
      eyebrow: "What you gain",
      title: "Less time scoping. More clarity on what deserves investment.",
      body: "Give your team the research and structure to assess early ideas before committing to deeper development.",
      cards: [
        { title: "Get to the discussion faster", body: "Bring a clearly defined idea and a research-backed assessment to the table—so your team can spend more time discussing the opportunity, not assembling the starting point.", tone: "pistachio" },
        { title: "See the strengths and the risks", body: "Understand what supports the idea, what challenges it, and where the evidence is still too limited to draw a conclusion.", tone: "pomelo" },
        { title: "Focus your next investment", body: "Use the assessment alongside your team’s expertise to decide what to advance, what to investigate further, and what to park.", tone: "amber" },
      ],
    },
    /** Illustrative dashboards for a fictional concept, shown in "Why arkko" and "What you get". */
    dashboards: {
      note: "Illustrative dashboards · fictional concept",
      open: "Open full size",
      evaluation: { label: "The evaluation", alt: "Example evaluation dashboard for a fictional drink, Afternoon Lift: four engine gauges for structural market, cultural momentum, consumer fit and competitive white space, with component dials, an adoption path, gates and constraints." },
      scorecard: { label: "The scorecard", alt: "Example evaluation scorecard for Afternoon Lift: engine scores against their maximums, a heatmap of 24 components, gates and constraint severity." },
      research: { label: "The research", alt: "Example research coverage for Afternoon Lift: how many of the 24 components have direct evidence, a coverage map, evidence packets and open follow-up requests." },
    },
    categories: ["Beverage opportunities", "Food & snack opportunities", "Flavor & format exploration"],
    get: {
      eyebrow: "What you get",
      title: "From an early idea to a structured assessment.",
      items: [
        { title: "A structured idea", body: "Clarify who it is for, the need it addresses, what it offers, and why someone would choose it." },
        { title: "A framework-led evaluation", body: "Examine the idea’s potential through Arkko’s CPG innovation frameworks, with its strengths, weaknesses, and assumptions brought into view." },
        { title: "Priorities for validation", body: "Understand the unresolved questions and what needs further investigation before moving forward." },
      ],
    },
    example: {
      eyebrow: "Example",
      title: "See what Arkko brings to the idea.",
      body: "Explore a sample structured idea and evaluation—from the initial proposition to the questions that need answering next.",
      note: "Illustrative example · fictional brand · no consumer testing conducted",
      fullLink: "View the full sample evaluation",
      tabs: { idea: "The starting idea", structured: "How Arkko structured it", evaluation: "The evaluation", validate: "What to validate next" },
      idea: {
        label: "The starting idea, as submitted",
        quote: "A lighter afternoon drink for people who want a lift without reaching for an energy drink.",
        context: "Brand: VELA, a challenger beverage brand. Context: looking for a new occasion beyond morning coffee alternatives.",
        asideTitle: "Where most ideas start",
        aside: "A promising instinct, but the consumer, the need and the reason to switch are still implicit. That is what Arkko structures next.",
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
      title: "Start with your idea. Get a research-backed assessment.",
      steps: [
        { title: "Share your brief", body: "Tell Arkko about your idea, brand, business context, and constraints." },
        { title: "Arkko researches it", body: "The market, consumers, competition and feasibility, with sources behind every finding." },
        { title: "Explore the evaluation", body: "Review the idea’s strengths, weaknesses, assumptions, and open questions." },
        { title: "Plan what to validate next", body: "Use the assessment to guide further investigation and discussion." },
      ],
    },
    faq: {
      title: "Questions, answered plainly.",
      items: [
        { q: "Why use Arkko instead of a general AI tool?", a: "Arkko gives your team a ready-built process for researching and evaluating food and beverage ideas. Its frameworks, developed through more than 20 years of CPG innovation experience, guide the questions, research, and assessment—so your team does not have to design the process from scratch." },
        { q: "What can I use Arkko for today?", a: "Use Arkko to turn an early food or beverage idea into a clear proposition, research its potential, and assess its strengths, risks, and unanswered questions. It helps your team decide what to advance, investigate further, or park." },
        { q: "What does Arkko research?", a: "Arkko examines consumer needs and behavior, market conditions, competitors and substitutes, and commercial requirements such as manufacturing, channel access, and costs." },
        { q: "Does an evaluation prove that an idea will succeed?", a: "No. Arkko provides an evidence-based assessment—not a prediction or guarantee of success. It helps identify what looks promising and what still needs testing. It does not replace consumer research, product testing, technical development, or commercial validation." },
        { q: "What do the scores mean?", a: "Scores summarize how the available evidence aligns with Arkko’s evaluation criteria. They are not probabilities of success. Where evidence is limited, an assessment may be provisional or a criterion may remain unscored." },
      ],
    },
    contact: {
      eyebrow: "Talk to arkko",
      title: "Tell us about your next idea.",
      body: "Leave a few details and we’ll get back to you.",
      demoLink: "Or see it work first: try the demo",
      fields: { name: "Your name", email: "Work email", company: "Company (optional)", message: "What would you like to talk about?" },
      send: "Send message",
      sentTitle: "Thanks, your message is with us.",
      sentBody: "We’ll reply by email soon.",
    },
    closing: {
      title: "Give your next idea a more experienced starting point.",
      body: "Structure the proposition, examine its potential, and understand what needs validating next.",
    },
    footer: "The innovation partner for ambitious CPG brands.",
  },
  /**
   * Feature switches. The intake chat is kept in the code but turned off for now (form only, Oct 2026):
   * set chatIntake to true to bring back the chat-or-form choice and the /api/intake/chat endpoint.
   */
  features: {
    chatIntake: true,
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
