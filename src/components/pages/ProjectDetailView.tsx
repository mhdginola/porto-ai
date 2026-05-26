"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { getLocalizedProject } from "@/content/projects-i18n";
import { Container } from "@/components/ui/Container";
import { TechBadge } from "@/components/ui/TechBadge";
import type { Project } from "@/types";

type ProjectDetailViewProps = {
  project: Project;
  listHref: "/projects" | "/work";
  backLabelKey: "projects.backToProjects" | "work.backToWork";
};

export function ProjectDetailView({
  project,
  listHref,
  backLabelKey,
}: ProjectDetailViewProps) {
  const { locale, t } = useLocale();
  const localized = getLocalizedProject(project, locale);

  return (
    <Container className="py-16">
      <Link
        href={listHref}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t(backLabelKey)}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        {localized.title}
      </h1>
      <p className="mt-2 max-w-2xl text-foreground/70">{localized.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <TechBadge key={tag} name={tag} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {project.liveUrl && (
          <Link
            href={project.liveUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> {t("projects.live")}
          </Link>
        )}
        {project.repoUrl && (
          <Link
            href={project.repoUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            <Github className="h-3.5 w-3.5" /> {t("projects.source")}
          </Link>
        )}
      </div>

      <article className="prose prose-neutral dark:prose-invert mt-10 max-w-2xl">
        <p className="whitespace-pre-line">{localized.description}</p>

        {localized.highlights.length > 0 && (
          <>
            <h2>{t("projects.highlights")}</h2>
            <ul>
              {localized.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        )}
      </article>
    </Container>
  );
}
