import { fail, json } from "@/lib/http";
import { allowContact, contactSchema } from "@/lib/contact";
import { insertContact, newId, now } from "@/lib/db";

/** Save a message from the contact form. The team reads them in the Contacts table. */
export async function POST(req: Request) {
  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
    return fail(400, "Please check the highlighted fields.", { fields });
  }
  const { website, ...c } = parsed.data;
  if (website) return json({ ok: true }, 201);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!allowContact(ip)) return fail(429, "You’ve sent several messages already. Please try again later.");

  await insertContact({ id: newId("msg"), ...c, company: c.company || undefined, createdAt: now() });
  return json({ ok: true }, 201);
}
