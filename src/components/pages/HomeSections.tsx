"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { ProjectCard } from "@/components/sections/ProjectCard";
import { Container } from "@/components/ui/Container";
import { TechBadge } from "@/components/ui/TechBadge";
import { getFeaturedProjects } from "@/content/projects";
import { profile } from "@/content/profile";

export function HomeSections() {
  const { t } = useLocale();
  const featured = getFeaturedProjects();
  const highlightedSkills = [
    ...profile.skills.backend.slice(0, 5),
    ...profile.skills.frontend.slice(0, 4),
    ...profile.skills.ai.slice(0, 4),
    ...profile.skills.blockchain.slice(0, 2),
    ...profile.skills.devops.slice(0, 3),
  ];

  return (
    <Container className="space-y-20 pb-16">
      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("home.featuredProjects")}
          </h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
          >
            {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          {t("home.techTitle")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {highlightedSkills.map((s) => (
            <TechBadge key={s} name={s} size="md" />
          ))}
        </div>
        <p className="mt-4 text-sm text-foreground/50">
          {t("home.techHint")}{" "}
          <Link
            href="/about"
            className="underline-offset-4 hover:underline"
          >
            {t("home.aboutLink")}
          </Link>
          .
        </p>
      </section>
    </Container>
  );
}
