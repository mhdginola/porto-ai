import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateSite } from "@/components/company-templates/TemplateSite";
import { companyTemplates, getCompanyTemplate } from "@/content/company-templates";

type Params = { slug: string };

export function generateStaticParams() {
  return companyTemplates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const tpl = getCompanyTemplate((await params).slug);
  return {
    title: tpl ? `${tpl.company.name} — ${tpl.company.tagline}` : "Not found",
    // The bare template is a preview frame; the catalog/preview pages are the indexable ones.
    robots: { index: false, follow: false },
  };
}

/** The template on its own — loaded in iframes by the catalog and the preview page. */
export default async function TemplateViewPage({ params }: { params: Promise<Params> }) {
  const tpl = getCompanyTemplate((await params).slug);
  if (!tpl) notFound();
  return <TemplateSite template={tpl} />;
}
