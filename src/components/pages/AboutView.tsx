"use client";

import { Award, BookOpen, GraduationCap, MapPin, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { TechBadge } from "@/components/ui/TechBadge";
import {
  certificationI18n,
  educationI18n,
  experienceI18n,
  pick,
  pickList,
  profileI18n,
  publicationI18n,
} from "@/content/profile-i18n";
import {
  certifications,
  education,
  experiences,
  profile,
  publications,
} from "@/content/profile";
import type { TranslationKey } from "@/lib/i18n/translations";

const skillGroupKeys: Record<string, TranslationKey> = {
  backend: "about.skillGroup.backend",
  frontend: "about.skillGroup.frontend",
  ai: "about.skillGroup.ai",
  blockchain: "about.skillGroup.blockchain",
  devops: "about.skillGroup.devops",
  design: "about.skillGroup.design",
  databases: "about.skillGroup.databases",
  tools: "about.skillGroup.tools",
};

export function AboutView() {
  const { locale, t } = useLocale();

  return (
    <Container className="py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("about.title")}
        </h1>
        <p className="text-foreground/60">
          {pick(locale, profileI18n.headline)} · {profile.yearsOfExperience}+{" "}
          {t("about.yearsExperience")}
        </p>
      </div>

      <p className="mt-6 max-w-2xl whitespace-pre-line text-foreground/70">
        {pick(locale, profileI18n.bio)}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/70">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> {profile.location}
        </span>
        <Link
          href={`mailto:${profile.email}`}
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <Mail className="h-3.5 w-3.5" /> {profile.email}
        </Link>
        <span className="inline-flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5" /> {profile.phone}
        </span>
      </div>

      <section className="mt-14 space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("about.experience")}
        </h2>
        <ol className="space-y-8 border-l border-foreground/10 pl-6">
          {experiences.map((e) => {
            const localized = experienceI18n[e.company];
            const role = localized
              ? pick(locale, localized.role)
              : e.role;
            const description = localized
              ? pick(locale, localized.description)
              : e.description;
            const achievements = localized
              ? pickList(locale, localized.achievements)
              : e.achievements;

            return (
              <li key={`${e.company}-${e.period}`} className="relative">
                <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-foreground" />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {role} · {e.company}
                  </p>
                  <p className="text-xs text-foreground/50">{e.period}</p>
                </div>
                {e.location && (
                  <p className="text-xs text-foreground/50">{e.location}</p>
                )}
                <p className="mt-2 text-sm text-foreground/70">{description}</p>
                {achievements && achievements.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/70 marker:text-foreground/30">
                    {achievements.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.stack.map((s) => (
                    <TechBadge key={s} name={s} />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("about.skills")}
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {Object.entries(profile.skills).map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-sm font-medium text-foreground/60">
                {t(skillGroupKeys[group] ?? "about.skills")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((s) => (
                  <TechBadge key={s} name={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <GraduationCap className="h-5 w-5" /> {t("about.education")}
        </h2>
        <div className="mt-4 space-y-4">
          {education.map((ed) => (
            <div
              key={ed.institution}
              className="rounded-xl border border-foreground/10 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{ed.institution}</p>
                <p className="text-xs text-foreground/50">{ed.period}</p>
              </div>
              <p className="mt-1 text-sm text-foreground/70">
                {pick(locale, educationI18n.degree)} ·{" "}
                {pick(locale, educationI18n.field)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {ed.gpa && <Badge>GPA {ed.gpa}</Badge>}
                {educationI18n.honors[locale].map((h) => (
                  <Badge key={h}>{h}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Award className="h-5 w-5" /> {t("about.certifications")}
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {certifications.map((c) => (
            <li
              key={c.name}
              className="rounded-lg border border-foreground/10 px-4 py-3 text-sm"
            >
              {pick(locale, certificationI18n[c.name] ?? { en: c.name, id: c.name })}
              {c.issuer && (
                <span className="text-foreground/50"> · {c.issuer}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <BookOpen className="h-5 w-5" /> {t("about.publications")}
        </h2>
        <ul className="mt-4 space-y-3">
          {publications.map((p) => (
            <li
              key={p.title}
              className="rounded-lg border border-foreground/10 px-4 py-3"
            >
              <p className="text-sm font-medium">
                {pick(locale, publicationI18n.title)}
              </p>
              <p className="mt-0.5 text-xs text-foreground/60">
                {pick(locale, publicationI18n.venue)} · {p.year}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("about.howIWork")}
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {profileI18n.values[locale].map((v) => (
            <li
              key={v}
              className="rounded-lg border border-foreground/10 px-4 py-3 text-sm"
            >
              {v}
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
