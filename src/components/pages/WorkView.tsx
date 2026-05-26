"use client";

import { Container } from "@/components/ui/Container";
import { useLocale } from "@/components/layout/LocaleProvider";
import { getProjectsByVisibility } from "@/content/projects";
import { ProjectListSection } from "@/components/pages/ProjectListSection";

export function WorkView() {
  const { t } = useLocale();
  const privateList = getProjectsByVisibility("private");

  return (
    <Container className="py-16">
      <ProjectListSection
        projects={privateList}
        titleKey="work.title"
        subtitleKey="work.subtitle"
        basePath="/work"
        crossLink={{
          href: "/projects",
          labelKey: "work.seePublicProjects",
        }}
      />
      <p className="mt-8 max-w-2xl text-xs text-foreground/45">
        {t("work.disclaimer")}
      </p>
    </Container>
  );
}
