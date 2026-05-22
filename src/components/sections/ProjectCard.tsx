"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { getLocalizedProject } from "@/content/projects-i18n";
import type { Project } from "@/types";
import { TechBadge } from "@/components/ui/TechBadge";

export function ProjectCard({ project }: { project: Project }) {
  const { locale } = useLocale();
  const localized = getLocalizedProject(project, locale);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-foreground/10 p-5 transition-colors hover:bg-foreground/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            {localized.title}
          </h3>
          <p className="mt-1 text-sm text-foreground/60">{localized.summary}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-text" />
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5">
        {project.tags.slice(0, 4).map((t) => (
          <TechBadge key={t} name={t} />
        ))}
      </div>
    </Link>
  );
}
