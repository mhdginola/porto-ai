import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateDetails } from "@/components/company-templates/TemplateDetails";
import { TemplatePreview } from "@/components/company-templates/TemplatePreview";
import { jsonLdString, templatePreviewJsonLd } from "@/lib/company-template-seo";
import { companyTemplates, getCompanyTemplate } from "@/content/company-templates";

type Params = { slug: string };

export function generateStaticParams() {
  return companyTemplates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const tpl = getCompanyTemplate((await params).slug);
  if (!tpl) return { title: "Not found" };
  const title = `${tpl.name} — template website ${tpl.industry.id.toLowerCase()}`;
  return {
    title,
    description: `${tpl.summary.id} Preview langsung di desktop, tablet, dan mobile.`,
    alternates: { canonical: `/templates/${tpl.slug}` },
    openGraph: { title, description: tpl.summary.id, type: "website", locale: "id_ID" },
  };
}

export default async function TemplatePreviewPage({ params }: { params: Promise<Params> }) {
  const tpl = getCompanyTemplate((await params).slug);
  if (!tpl) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(templatePreviewJsonLd(tpl)) }}
      />
      <TemplatePreview template={tpl}>
        <TemplateDetails template={tpl} />
      </TemplatePreview>
    </>
  );
}
