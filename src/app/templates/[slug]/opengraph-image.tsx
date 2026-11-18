import { notFound } from "next/navigation";
import { companyTemplates, getCompanyTemplate } from "@/content/company-templates";
import { ogSize, templateOgImage } from "@/lib/company-template-og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Company profile website template";

export function generateStaticParams() {
  return companyTemplates.map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const tpl = getCompanyTemplate((await params).slug);
  if (!tpl) notFound();
  return templateOgImage(tpl, "catalog");
}
