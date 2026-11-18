import type { Metadata } from "next";
import { TemplatesCatalogView } from "@/components/company-templates/TemplatesCatalogView";
import { companyTemplates } from "@/content/company-templates";
import { jsonLdString, templateCatalogJsonLd } from "@/lib/company-template-seo";

export const metadata: Metadata = {
  title: "Company Profile Website Templates",
  description:
    "Responsive company profile website templates for law firms, contractors, clinics, cafés, logistics and education — with live previews.",
  alternates: { canonical: "/templates" },
};

export default function TemplatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(templateCatalogJsonLd(companyTemplates)) }}
      />
      <TemplatesCatalogView />
    </>
  );
}
