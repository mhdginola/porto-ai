"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { ProjectCard } from "@/components/sections/ProjectCard";
import type { Project } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

type ProjectListSectionProps = {
  projects: Project[];
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  basePath: "/projects" | "/work";
  emptyKey?: TranslationKey;
  crossLink?: {
    href: string;
    labelKey: TranslationKey;
  };
};

export function ProjectListSection({
  projects,
  titleKey,
  subtitleKey,
  basePath,
  emptyKey,
  crossLink,
}: ProjectListSectionProps) {
  const { t } = useLocale();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t(titleKey)}
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">{t(subtitleKey)}</p>

      {projects.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} basePath={basePath} />
          ))}
        </div>
      ) : (
        emptyKey && (
          <p className="mt-10 rounded-xl border border-dashed border-foreground/15 px-6 py-10 text-center text-sm text-foreground/55">
            {t(emptyKey)}
          </p>
        )
      )}

      {crossLink && (
        <p className="mt-10 text-sm text-foreground/60">
          <Link
            href={crossLink.href}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary-text"
          >
            {t(crossLink.labelKey)}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      )}
    </>
  );
}
