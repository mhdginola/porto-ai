import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailView } from "@/components/pages/ProjectDetailView";
import { getProjectBySlug, getProjectsByVisibility } from "@/content/projects";

type Params = { slug: string };

const STATIC_DEMO_SLUGS = new Set([
  "crud-demo",
  "auth-demo",
  "porto-ai",
  "marketplace-demo",
  "property-agency-builder",
]);

export function generateStaticParams() {
  return getProjectsByVisibility("public")
    .filter((p) => !STATIC_DEMO_SLUGS.has(p.slug))
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug, "public");
  if (!project) return { title: "Not found" };
  return { title: project.title, description: project.summary };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug, "public");
  if (!project) notFound();

  return (
    <ProjectDetailView
      project={project}
      listHref="/projects"
      backLabelKey="projects.backToProjects"
    />
  );
}
