"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Github,
  Linkedin,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FormField } from "@/components/ui/FormField";
import {
  MESSAGE_MAX,
  MESSAGE_MIN,
  NAME_MAX,
  type ContactCategory,
  type ContactResponse,
} from "@/lib/contact/schema";
import type { TranslationKey } from "@/lib/i18n/translations";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const channels = [
  {
    icon: Mail,
    label: siteConfig.links.email,
    href: `mailto:${siteConfig.links.email}`,
  },
  {
    icon: Phone,
    label: siteConfig.links.phone,
    href: `https://wa.me/${siteConfig.links.phone.replace(/[^0-9]/g, "")}`,
  },
  {
    icon: Linkedin,
    label: "linkedin.com/in/ginola-ginola",
    href: siteConfig.links.linkedin,
  },
  {
    icon: Github,
    label: "github.com/mhdginola",
    href: siteConfig.links.github,
  },
] as const;

type Shown = Exclude<ContactCategory, "spam">;
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactView() {
  const { t, locale } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [category, setCategory] = useState<Shown | null>(null);
  const renderedAt = useRef(0);

  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = t("contact.form.error.name");
    if (!EMAIL_RE.test(email.trim())) next.email = t("contact.form.error.email");
    if (message.trim().length < MESSAGE_MIN) next.message = t("contact.form.error.message");
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    setFormError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          message,
          website,
          locale: locale === "id" ? "id" : "en",
          elapsedMs: Date.now() - renderedAt.current,
        }),
      });
      const data = (await res.json()) as ContactResponse;
      if (!data.ok) {
        setFormError(
          data.code === "rate_limited"
            ? t("contact.form.error.rate")
            : t("contact.form.error.generic")
        );
        setStatus("idle");
        return;
      }
      setCategory(data.category);
      setStatus("sent");
    } catch {
      setFormError(t("contact.form.error.generic"));
      setStatus("idle");
    }
  }

  function reset() {
    setMessage("");
    setCategory(null);
    setStatus("idle");
    renderedAt.current = Date.now();
  }

  const remaining = MESSAGE_MAX - message.length;

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("contact.title")}
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">{t("contact.subtitle")}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 sm:p-6 lg:col-span-3">
          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-text">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{t("contact.form.success.title")}</h2>
                {category && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft/60 px-2.5 py-1 text-xs font-medium text-primary-text">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("contact.form.detected")}:{" "}
                    {t(`contact.form.category.${category}` as TranslationKey)}
                  </p>
                )}
                <p className="mt-3 text-sm text-foreground/70">
                  {t(
                    category
                      ? (`contact.form.success.${category}` as TranslationKey)
                      : "contact.form.success.generic"
                  )}
                </p>
                <Button variant="outline" size="sm" className="mt-6" onClick={reset}>
                  {t("contact.form.another")}
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={onSubmit}
                noValidate
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-semibold">{t("contact.form.title")}</h2>
                  <p className="mt-1 text-sm text-foreground/60">{t("contact.form.subtitle")}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="contact-name"
                    label={t("contact.form.name")}
                    autoComplete="name"
                    maxLength={NAME_MAX}
                    value={name}
                    error={errors.name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <FormField
                    id="contact-email"
                    type="email"
                    label={t("contact.form.email")}
                    autoComplete="email"
                    value={email}
                    error={errors.email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <FormField
                  id="contact-company"
                  label={t("contact.form.company")}
                  autoComplete="organization"
                  maxLength={120}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium text-foreground/60"
                  >
                    {t("contact.form.message")}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={6}
                    maxLength={MESSAGE_MAX}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("contact.form.messagePlaceholder")}
                    aria-invalid={errors.message ? true : undefined}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    className={cn(
                      "w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors",
                      errors.message
                        ? "border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-foreground/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                    )}
                  />
                  <div className="flex items-start justify-between gap-3 text-[11px]">
                    {errors.message ? (
                      <p id="contact-message-error" role="alert" className="text-red-600 dark:text-red-400">
                        {errors.message}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className={cn("tabular-nums text-foreground/40", remaining < 200 && "text-amber-600")}>
                      {remaining}
                    </span>
                  </div>
                </div>

                {/* Honeypot: invisible to people, filled in by naive bots. */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                {formError && (
                  <p
                    role="alert"
                    className="flex items-start gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {formError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-foreground/45">{t("contact.form.privacy")}</p>
                  <Button type="submit" disabled={status === "sending"}>
                    {status === "sending" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {status === "sending" ? t("contact.form.sending") : t("contact.form.send")}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </section>

        <aside className="space-y-4 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            {t("contact.channels")}
          </p>
          <div className="grid gap-3">
            {channels.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                className="group flex items-center gap-3 rounded-lg border border-foreground/10 px-4 py-3 text-sm transition-colors hover:bg-foreground/5"
              >
                <Icon className="h-4 w-4 text-foreground/60 group-hover:text-foreground" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>

          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 text-foreground/60" />
              <div>
                <p className="text-sm font-medium">{t("contact.preferChat")}</p>
                <p className="mt-1 text-sm text-foreground/60">{t("contact.chatHint")}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
