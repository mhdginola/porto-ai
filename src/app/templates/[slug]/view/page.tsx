import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateSite } from "@/components/company-templates/TemplateSite";
import { companyTemplates, getCompanyTemplate } from "@/content/company-templates";
import { templateMetadata } from "@/lib/company-template-seo";

type Params = { slug: string };

export function generateStaticParams() {
  return companyTemplates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const tpl = getCompanyTemplate((await params).slug);
  if (!tpl) return { title: "Not found", robots: { index: false } };
  // Full client-site metadata (title, description, Open Graph, canonical) — but
  // noindex here: the companies are fictional. A client site passes indexable: true.
  return templateMetadata(tpl, { indexable: false });
}

/** The template on its own — loaded in iframes by the catalog and the preview page. */
export default async function TemplateViewPage({ params }: { params: Promise<Params> }) {
  const tpl = getCompanyTemplate((await params).slug);
  if (!tpl) notFound();
  return <TemplateSite template={tpl} />;
}
