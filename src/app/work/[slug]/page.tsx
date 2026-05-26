import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailView } from "@/components/pages/ProjectDetailView";
import { getProjectBySlug, getProjectsByVisibility } from "@/content/projects";

type Params = { slug: string };

export function generateStaticParams() {
  return getProjectsByVisibility("private").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug, "private");
  if (!project) return { title: "Not found" };
  return { title: project.title, description: project.summary };
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug, "private");
  if (!project) notFound();

  return (
    <ProjectDetailView
      project={project}
      listHref="/work"
      backLabelKey="work.backToWork"
    />
  );
}
