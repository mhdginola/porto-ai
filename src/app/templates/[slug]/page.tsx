import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplatePreview } from "@/components/company-templates/TemplatePreview";
import { companyTemplates, getCompanyTemplate } from "@/content/company-templates";

type Params = { slug: string };

export function generateStaticParams() {
  return companyTemplates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const tpl = getCompanyTemplate((await params).slug);
  if (!tpl) return { title: "Not found" };
  return { title: `${tpl.name} — template preview`, description: tpl.summary.en };
}

export default async function TemplatePreviewPage({ params }: { params: Promise<Params> }) {
  const tpl = getCompanyTemplate((await params).slug);
  if (!tpl) notFound();
  return <TemplatePreview template={tpl} />;
}
