"use client";

import { useLocale } from "@/components/layout/LocaleProvider";
import { ProjectCard } from "@/components/sections/ProjectCard";
import { Container } from "@/components/ui/Container";
import { projects } from "@/content/projects";

export function ProjectsView() {
  const { t } = useLocale();

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("projects.title")}
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">{t("projects.subtitle")}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </Container>
  );
}
