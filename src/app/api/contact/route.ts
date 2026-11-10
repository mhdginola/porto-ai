import { eq } from "drizzle-orm";
import { after } from "next/server";
import { classifyContactMessage } from "@/lib/contact/classify";
import {
  isAutoReplyEnabled,
  isEmailConfigured,
  sendAutoReply,
  sendOwnerNotification,
} from "@/lib/contact/email";
import { clientIp, hashIp, isRateLimited } from "@/lib/contact/rate-limit";
import {
  contactInputSchema,
  MIN_FILL_MS,
  type ContactResponse,
} from "@/lib/contact/schema";
import { db } from "@/lib/db";
import { contactMessages, type ContactMessageRow } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Spam must be this confident before we drop notifications for it. */
const SPAM_THRESHOLD = 0.7;

function reply(body: ContactResponse, status = 200) {
  return Response.json(body, { status });
}

/**
 * Smart contact form:
 * 1. validate + bot checks (honeypot, fill time) + rate limit
 * 2. save the message first, so a lead is never lost
 * 3. AI triage: category, priority, summary, draft reply
 * 4. after the response: email the owner (+ optional templated auto-reply)
 */
export async function POST(req: Request) {
  const parsed = contactInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return reply({ ok: false, code: "invalid_input" }, 400);
  const input = parsed.data;

  // Bots: pretend it worked so they don't adapt, but store nothing.
  if (input.website || input.elapsedMs < MIN_FILL_MS) {
    return reply({ ok: true, category: null });
  }

  const ipHash = hashIp(clientIp(req));
  let row: ContactMessageRow;
  try {
    if (await isRateLimited(ipHash, input.email)) {
      return reply({ ok: false, code: "rate_limited" }, 429);
    }
    [row] = await db
      .insert(contactMessages)
      .values({
        name: input.name,
        email: input.email,
        company: input.company || null,
        message: input.message,
        locale: input.locale,
        ipHash,
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      })
      .returning();
  } catch (err) {
    console.error("[contact] save failed:", err);
    return reply({ ok: false, code: "server_error" }, 500);
  }

  const ai = await classifyContactMessage(input);
  const isSpam =
    ai.ok && ai.value.category === "spam" && ai.value.confidence >= SPAM_THRESHOLD;

  try {
    [row] = await db
      .update(contactMessages)
      .set(
        ai.ok
          ? {
              category: ai.value.category,
              confidence: Math.round(ai.value.confidence * 100),
              priority: ai.value.priority,
              summary: ai.value.summary,
              suggestedReply: ai.value.suggestedReply,
              aiModel: ai.model,
              status: isSpam ? "spam" : "new",
            }
          : { aiModel: ai.model, aiError: ai.error }
      )
      .where(eq(contactMessages.id, row.id))
      .returning();
  } catch (err) {
    // The message is already saved; classification is a bonus.
    console.error("[contact] saving classification failed:", err);
  }

  if (!isSpam && isEmailConfigured()) {
    const saved = row;
    after(async () => {
      try {
        await sendOwnerNotification(saved);
        await db
          .update(contactMessages)
          .set({ notifiedAt: new Date() })
          .where(eq(contactMessages.id, saved.id));
      } catch (err) {
        console.error("[contact] owner notification failed:", err);
      }
      if (isAutoReplyEnabled()) {
        try {
          await sendAutoReply(saved);
          await db
            .update(contactMessages)
            .set({ autoRepliedAt: new Date() })
            .where(eq(contactMessages.id, saved.id));
        } catch (err) {
          console.error("[contact] auto-reply failed:", err);
        }
      }
    });
  }

  const category = ai.ok && ai.value.category !== "spam" ? ai.value.category : null;
  return reply({ ok: true, category });
}
