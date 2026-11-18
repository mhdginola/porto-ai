/**
 * SEO for company-profile templates: page metadata + schema.org JSON-LD.
 * Built from the template data, so a client site made from a template ships with
 * correct title/description/Open Graph and local-business structured data.
 */
import type { Metadata } from "next";
import type { CompanyTemplate } from "@/content/company-templates";
import { siteConfig } from "@/lib/site";

const base = siteConfig.url.replace(/\/$/, "");

export function templateUrl(t: CompanyTemplate): string {
  return `${base}/templates/${t.slug}/view`;
}

/** ~155 chars, cut on a word boundary. */
function clip(text: string, max = 155): string {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max - 1))}…`;
}

export function templateDescription(t: CompanyTemplate): string {
  return clip(`${t.company.name} — ${t.company.tagline} di ${t.seo.locality}. ${t.hero.subtitle}`);
}

/**
 * Metadata for the rendered template. `indexable` stays false in the portfolio
 * (fictional companies must not be indexed); a client site sets it to true.
 */
export function templateMetadata(t: CompanyTemplate, { indexable = false } = {}): Metadata {
  const title = t.seo.title ?? `${t.company.name} — ${t.company.tagline} di ${t.seo.locality}`;
  const description = templateDescription(t);
  const url = templateUrl(t);
  return {
    title: { absolute: title },
    description,
    keywords: t.seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: t.company.name,
      locale: "id_ID",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

/** schema.org graph: the business (local-business subtype) + its FAQ page. */
export function templateJsonLd(t: CompanyTemplate) {
  const url = templateUrl(t);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": t.seo.schemaType,
        "@id": `${url}#business`,
        name: t.company.name,
        alternateName: `${t.company.name} ${t.company.tagline}`,
        description: t.about.body,
        url,
        telephone: t.contact.phone,
        email: t.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: t.contact.address,
          addressLocality: t.seo.locality,
          addressRegion: t.seo.region,
          addressCountry: "ID",
        },
        areaServed: t.seo.region,
        openingHours: t.seo.openingHours,
        ...(t.seo.priceRange && { priceRange: t.seo.priceRange }),
        makesOffer: t.services.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.title, description: s.description },
        })),
        // Testimonials are deliberately not marked up: Google treats self-published
        // reviews of your own business as ineligible ("self-serving") review markup.
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: t.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

/** JSON for a <script type="application/ld+json">, with "<" escaped (XSS-safe). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
