import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254),
  company: z.string().trim().max(160).optional(),
  message: z.string().trim().min(1, "Please write a short message.").max(4000),
  /** Left empty by people; bots that fill every field are quietly ignored. */
  website: z.string().optional(),
});

/**
 * Messages one visitor (by IP) may send per hour. Kept in memory, so it is per server instance:
 * a guard against a form being spammed, not a hard cap.
 */
const RATE = { limit: 5, windowMs: 60 * 60 * 1000 };
const hits = new Map<string, number[]>();

export function allowContact(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs);
  if (recent.length >= RATE.limit) return false;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return true;
}
