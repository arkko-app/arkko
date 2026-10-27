import { fail, hasDraftAccess, json } from "@/lib/http";
import { missingRequired } from "@/lib/intake";
import { emailSchema } from "@/lib/schema";
import { config } from "@/lib/config";
import { countSubmittedSince, getRequest, now, updateRequest } from "@/lib/db";
import { handOff } from "@/lib/otto";
import { publicStatus } from "@/lib/status";

/** Every submitted brief starts a paid research run, so submissions are capped per UTC day. */
async function dailyLimitReached() {
  if (config.dailyBriefLimit <= 0) return false;
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  return (await countSubmittedSince(midnight.toISOString())) >= config.dailyBriefLimit;
}

/**
 * Submit the brief and hand it to Otto. The email is optional: it is only
 * used to send the results, and only when the user provides it.
 * Safe to retry: a request that was already submitted is never submitted twice.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/requests/[id]/submit">) {
  const { id } = await ctx.params;
  const rec = await getRequest(id);
  if (!rec || !hasDraftAccess(req, rec)) return fail(404, "Request not found");

  if (rec.status !== "draft") return json(publicStatus(rec));

  const body = await req.json().catch(() => null);
  const rawEmail = typeof body?.email === "string" ? body.email.trim() : "";
  const email = rawEmail ? emailSchema.safeParse(rawEmail) : null;
  if (email && !email.success) return fail(400, "Enter a valid email address");
  const missing = missingRequired(rec.answers);
  if (missing.length) return fail(400, "Some required answers are missing", { missing });
  if (await dailyLimitReached())
    return fail(429, "We’ve reached today’s limit for new briefs. Your brief is saved here, so please submit it again tomorrow.");

  const submitted = await updateRequest(id, (r) => {
    if (r.status !== "draft") return; // lost a race with a concurrent retry
    if (email?.success) {
      r.email = email.data;
      r.emailRequestedAt = now();
    }
    r.status = "submitted";
    r.submittedAt = now();
  });
  if (!submitted) return fail(404, "Request not found");
  if (submitted.handoff.length) return json(publicStatus(submitted));

  const afterHandoff = await handOff(submitted);
  return json(publicStatus(afterHandoff ?? submitted));
}
