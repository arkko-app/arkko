import { z } from "zod";

const image = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  label: z.string().optional(),
  illustrative: z.boolean().optional(),
});

const sectionId = z.enum(["overview", "brief", "opportunity", "landscape", "risks", "evidence"]);

export const resultsSchema = z
  .object({
    schemaVersion: z.literal(1),
    client: z.object({ name: z.string().min(1), fictional: z.boolean().optional() }),
    project: z.object({ title: z.string().min(1), stage: z.string().optional() }),
    concept: z.object({
      eyebrow: z.string().optional(),
      name: z.string().min(1),
      headline: z.string().min(1),
      proposition: z.string().min(1),
      image: image.optional(),
      who: z.string().optional(),
      when: z.string().optional(),
      promise: z.string().optional(),
    }),
    pillars: z
      .array(
        z.object({
          label: z.string(),
          title: z.string(),
          status: z.string(),
          target: sectionId,
          linkLabel: z.string(),
        }),
      )
      .max(4)
      .optional(),
    brief: z
      .object({
        summary: z.string(),
        quotes: z.array(z.string()).optional(),
        imageIds: z.array(z.string()).optional(),
        images: z.array(image).optional(),
        transformation: z.array(z.object({ from: z.string(), to: z.string() })).optional(),
      })
      .optional(),
    findings: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          summary: z.string(),
          detail: z.string().optional(),
          kind: z.enum(["sourced", "interpretation", "assumption"]),
          sourceIds: z.array(z.string()).optional(),
          chartId: z.string().optional(),
        }),
      )
      .optional(),
    charts: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          type: z.enum(["bar", "line"]),
          unit: z.string(),
          points: z.array(z.object({ label: z.string(), value: z.number().finite() })).min(1),
          note: z.string().optional(),
          // Charts must cite at least one source: no unsourced numbers on screen.
          sourceIds: z.array(z.string()).min(1),
        }),
      )
      .optional(),
    landscape: z
      .object({
        summary: z.string().optional(),
        attributes: z.array(z.string()),
        competitors: z.array(
          z.object({
            name: z.string(),
            brand: z.string().optional(),
            image: image.optional(),
            attributes: z.record(z.string(), z.string()),
            sourceIds: z.array(z.string()).optional(),
          }),
        ),
      })
      .optional(),
    risks: z
      .array(
        z.object({
          id: z.string(),
          statement: z.string(),
          kind: z.enum(["assumption", "risk", "open_question"]),
          test: z.string().optional(),
        }),
      )
      .optional(),
    nextTest: z.object({ question: z.string(), method: z.string().optional() }).optional(),
    sources: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          url: z.string().url().optional(),
          publisher: z.string().optional(),
          accessed: z.string().optional(),
        }),
      )
      .optional(),
    deliverables: z
      .object({ pdf: z.string().optional(), pdfLabel: z.string().optional() })
      .optional(),
    disclaimer: z.string().optional(),
  })
  .superRefine((p, ctx) => {
    // Every referenced source must exist, so source associations never break.
    const ids = new Set((p.sources ?? []).map((s) => s.id));
    const check = (refs: string[] | undefined, where: string) =>
      refs?.forEach((id) => {
        if (!ids.has(id)) ctx.addIssue({ code: "custom", message: `Unknown source "${id}" in ${where}` });
      });
    p.findings?.forEach((f) => {
      check(f.sourceIds, `finding ${f.id}`);
      if (f.kind === "sourced" && !f.sourceIds?.length)
        ctx.addIssue({ code: "custom", message: `Finding ${f.id} is "sourced" but cites no sources` });
      if (f.chartId && !p.charts?.some((c) => c.id === f.chartId))
        ctx.addIssue({ code: "custom", message: `Finding ${f.id} references unknown chart ${f.chartId}` });
    });
    p.charts?.forEach((c) => check(c.sourceIds, `chart ${c.id}`));
    p.landscape?.competitors.forEach((c) => check(c.sourceIds, `competitor ${c.name}`));
  });

export const eventSchema = z.object({
  type: z.enum(["research_started", "final_email_sent", "error"]),
  detail: z.string().max(50_000).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const reviewSchema = z.object({
  stage: z.enum(["idea", "concept"]),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  body: z.string().max(20_000).optional(),
  highlights: z
    .array(z.object({ label: z.string().min(1).max(40), value: z.string().min(1).max(300) }))
    .max(6)
    .optional(),
  image: image.optional(),
});

export const decisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approved"), feedback: z.string().trim().max(5000).optional() }),
  z.object({
    decision: z.literal("changes_requested"),
    feedback: z.string({ error: "Tell us what to change" }).trim().min(3, "Tell us what to change").max(5000),
  }),
]);

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
