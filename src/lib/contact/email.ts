/** Minimal Resend client (REST) + contact-form email templates. */
import type { ContactMessageRow } from "@/lib/db/schema";
import { siteConfig } from "@/lib/site";

/** Overridable for local mocks/tests. */
const RESEND_URL = process.env.RESEND_API_URL?.trim() || "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress() {
  return process.env.CONTACT_FROM_EMAIL?.trim() || "Portfolio <onboarding@resend.dev>";
}

function ownerAddress() {
  return process.env.CONTACT_TO_EMAIL?.trim() || siteConfig.links.email;
}

/**
 * Auto-replies send mail to an address typed into a public form, so they are
 * opt-in and need a verified sending domain (onboarding@resend.dev can only
 * deliver to the Resend account owner).
 */
export function isAutoReplyEnabled(): boolean {
  return isEmailConfigured() && process.env.CONTACT_AUTOREPLY === "true";
}

async function send(payload: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey: string;
}) {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": payload.idempotencyKey,
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      ...(payload.replyTo && { reply_to: payload.replyTo }),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
}

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Strip anything that would let the subject line be used for header tricks. */
function oneLine(value: string, max: number): string {
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

const CATEGORY_LABEL: Record<string, string> = {
  job_offer: "Job offer",
  freelance: "Freelance",
  collaboration: "Collaboration",
  question: "Question",
  spam: "Spam",
  other: "Other",
};

export async function sendOwnerNotification(row: ContactMessageRow) {
  const label = row.category ? CATEGORY_LABEL[row.category] : "Unclassified";
  const priority = row.priority === "high" ? " ⚡" : "";
  const subject = oneLine(
    `[${label}${priority}] ${row.name}${row.company ? ` (${row.company})` : ""} — ${row.summary ?? "new message"}`,
    180
  );

  const meta = [
    ["From", `${row.name} <${row.email}>`],
    ["Company", row.company || "—"],
    ["Category", `${label}${row.confidence != null ? ` (${row.confidence}%)` : ""}`],
    ["Priority", row.priority ?? "—"],
    ["Language", row.locale],
    ["AI", row.aiError ? `failed: ${row.aiError}` : (row.aiModel ?? "—")],
  ];

  const html = `
<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111">
  <p style="margin:0 0 12px"><strong>${esc(row.summary ?? "New contact form message")}</strong></p>
  <table style="border-collapse:collapse;margin-bottom:16px">
    ${meta
      .map(
        ([k, v]) =>
          `<tr><td style="padding:2px 12px 2px 0;color:#666">${esc(k)}</td><td>${esc(v)}</td></tr>`
      )
      .join("")}
  </table>
  <p style="margin:0 0 4px;color:#666">Message</p>
  <div style="white-space:pre-wrap;border-left:3px solid #ddd;padding:4px 12px;margin-bottom:16px">${esc(row.message)}</div>
  ${
    row.suggestedReply
      ? `<p style="margin:0 0 4px;color:#666">Suggested reply (AI draft)</p>
  <div style="white-space:pre-wrap;background:#f5f5f5;padding:8px 12px;border-radius:6px">${esc(row.suggestedReply)}</div>`
      : ""
  }
  <p style="margin-top:16px;color:#999;font-size:12px">Reply to this email to answer ${esc(row.name)} directly. Message #${row.id}.</p>
</div>`;

  const text = [
    row.summary ?? "New contact form message",
    "",
    ...meta.map(([k, v]) => `${k}: ${v}`),
    "",
    "Message:",
    row.message,
    ...(row.suggestedReply ? ["", "Suggested reply (AI draft):", row.suggestedReply] : []),
  ].join("\n");

  await send({
    to: ownerAddress(),
    subject,
    html,
    text,
    replyTo: row.email,
    idempotencyKey: `contact-${row.id}-owner`,
  });
}

const AUTO_REPLY = {
  en: {
    subject: "Thanks for reaching out",
    hi: (name: string | null) => (name ? `Hi ${name},` : "Hi,"),
    body: {
      job_offer: "Thanks for thinking of me for this role. I'll review the details and get back to you within 1–2 business days.",
      freelance: "Thanks for sharing your project. I'll look at the scope and reply within 1–2 business days, usually with a few questions.",
      collaboration: "Thanks for the collaboration idea — I'll get back to you soon.",
      question: "Thanks for your message. I'll reply as soon as I can.",
      other: "Thanks for your message. I'll reply as soon as I can.",
    } as Record<string, string>,
    sign: "Best regards,",
    note: "This is an automatic confirmation — your message was received.",
  },
  id: {
    subject: "Terima kasih sudah menghubungi saya",
    hi: (name: string | null) => (name ? `Halo ${name},` : "Halo,"),
    body: {
      job_offer: "Terima kasih sudah mempertimbangkan saya untuk posisi ini. Saya akan meninjau detailnya dan membalas dalam 1–2 hari kerja.",
      freelance: "Terima kasih sudah berbagi tentang project Anda. Saya akan mempelajari ruang lingkupnya dan membalas dalam 1–2 hari kerja, biasanya dengan beberapa pertanyaan.",
      collaboration: "Terima kasih atas ide kolaborasinya — saya akan segera membalas.",
      question: "Terima kasih atas pesannya. Saya akan membalas secepatnya.",
      other: "Terima kasih atas pesannya. Saya akan membalas secepatnya.",
    } as Record<string, string>,
    sign: "Salam,",
    note: "Ini konfirmasi otomatis — pesan Anda sudah diterima.",
  },
};

/**
 * Templated confirmation to the sender. Deliberately does NOT echo the message
 * or AI output, so the form can't be abused to send arbitrary content to
 * arbitrary addresses. The name is included only if it looks like a plain name.
 */
export async function sendAutoReply(row: ContactMessageRow) {
  const copy = row.locale === "id" ? AUTO_REPLY.id : AUTO_REPLY.en;
  const safeName = /^[\p{L} .'-]{2,40}$/u.test(row.name) ? row.name : null;
  const body = copy.body[row.category ?? "other"] ?? copy.body.other;
  const owner = siteConfig.name;

  const text = [copy.hi(safeName), "", body, "", copy.sign, owner, "", copy.note].join("\n");
  const html = `
<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#111">
  <p>${esc(copy.hi(safeName))}</p>
  <p>${esc(body)}</p>
  <p>${esc(copy.sign)}<br>${esc(owner)}<br><a href="${esc(siteConfig.url)}">${esc(siteConfig.url.replace(/^https?:\/\//, ""))}</a></p>
  <p style="color:#999;font-size:12px">${esc(copy.note)}</p>
</div>`;

  await send({
    to: row.email,
    subject: copy.subject,
    html,
    text,
    replyTo: ownerAddress(),
    idempotencyKey: `contact-${row.id}-autoreply`,
  });
}
