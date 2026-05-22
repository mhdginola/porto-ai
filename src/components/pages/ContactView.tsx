"use client";

import Link from "next/link";
import { Github, Linkedin, Mail, MessageCircle, Phone } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";

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

export function ContactView() {
  const { t } = useLocale();

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("contact.title")}
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">{t("contact.subtitle")}</p>

      <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
        {channels.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            className="group flex items-center gap-3 rounded-lg border border-foreground/10 px-4 py-3 text-sm transition-colors hover:bg-foreground/5"
          >
            <Icon className="h-4 w-4 text-foreground/60 group-hover:text-foreground" />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-12 max-w-2xl rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5">
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 h-5 w-5 text-foreground/60" />
          <div>
            <p className="text-sm font-medium">{t("contact.preferChat")}</p>
            <p className="mt-1 text-sm text-foreground/60">
              {t("contact.chatHint")}
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
