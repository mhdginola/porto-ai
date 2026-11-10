import { z } from "zod";

export const NAME_MAX = 80;
export const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 4000;
/** Humans take longer than this to fill the form; faster submits are bots. */
export const MIN_FILL_MS = 3000;

export const contactInputSchema = z.object({
  name: z.string().trim().min(2).max(NAME_MAX),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(MESSAGE_MIN).max(MESSAGE_MAX),
  locale: z.enum(["en", "id"]).default("en"),
  /** Honeypot — hidden from humans; any value means a bot. */
  website: z.string().max(200).optional().default(""),
  /** Milliseconds between the form rendering and submit. */
  elapsedMs: z.number().int().nonnegative().max(86_400_000),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

export const CONTACT_CATEGORIES = [
  "job_offer",
  "freelance",
  "collaboration",
  "question",
  "spam",
  "other",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const classificationSchema = z.object({
  category: z.enum(CONTACT_CATEGORIES),
  confidence: z.number().min(0).max(1),
  priority: z.enum(["high", "normal", "low"]),
  summary: z.string().max(400),
  suggestedReply: z.string().max(1500),
});

export type Classification = z.infer<typeof classificationSchema>;

export type ContactResponse =
  | { ok: true; category: Exclude<ContactCategory, "spam"> | null }
  | { ok: false; code: "invalid_input" | "rate_limited" | "server_error" };
