import type { Metadata } from "next";
import { TemplatesCatalogView } from "@/components/company-templates/TemplatesCatalogView";
import { companyTemplates } from "@/content/company-templates";
import { jsonLdString, templateCatalogJsonLd } from "@/lib/company-template-seo";

export const metadata: Metadata = {
  title: "Template Website Company Profile",
  description:
    "Template website company profile yang responsif untuk firma hukum, kontraktor, klinik, kafe, logistik, dan lembaga kursus — lengkap dengan preview langsung.",
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
