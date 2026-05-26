"use client";

import { Container } from "@/components/ui/Container";
import { getProjectsByVisibility } from "@/content/projects";
import { ProjectListSection } from "@/components/pages/ProjectListSection";

export function ProjectsView() {
  const publicList = getProjectsByVisibility("public");

  return (
    <Container className="py-16">
      <ProjectListSection
        projects={publicList}
        titleKey="projects.public.title"
        subtitleKey="projects.public.subtitle"
        basePath="/projects"
        emptyKey="projects.public.empty"
        crossLink={{
          href: "/work",
          labelKey: "projects.public.seeClientWork",
        }}
      />
    </Container>
  );
}
