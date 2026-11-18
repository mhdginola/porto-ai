import type { Metadata } from "next";
import { TemplatesCatalogView } from "@/components/company-templates/TemplatesCatalogView";

export const metadata: Metadata = {
  title: "Company Profile Website Templates",
  description:
    "Responsive company profile website templates for law firms, contractors, clinics, cafés, logistics and education — with live previews.",
};

export default function TemplatesPage() {
  return <TemplatesCatalogView />;
}
