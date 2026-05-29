import { z } from "zod";
import { defaultSiteConfig } from "@/lib/property-agency/defaults";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const listingSpecSchema = z.object({
  label: z.string().trim().max(60),
  value: z.string().trim().max(120),
});

export const listingSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(120),
  price: z.number().int().min(0),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area: z.number().int().min(0),
  landArea: z.number().int().min(0).optional().default(0),
  type: z.string().trim().min(1).max(40),
  status: z.enum(["sale", "rent"]).optional().default("sale"),
  facilities: z.array(z.string().trim().max(40)).max(12).optional().default([]),
  description: z.string().trim().max(3000).optional().default(""),
  specifications: z.array(listingSpecSchema).max(20).optional().default([]),
  imageUrl: z.string().trim().max(500).optional().default(""),
  floorPlanUrl: z.string().trim().max(500).optional().default(""),
  galleryUrls: z.array(z.string().trim().max(500)).max(12).optional().default([]),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(60),
  icon: z.string().trim().max(8).optional().default("🏠"),
  description: z.string().trim().max(120).optional().default(""),
});

export const howItWorksStepSchema = z.object({
  id: z.string().min(1),
  step: z.number().int().min(1).max(10),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240),
});

export const whyChooseUsItemSchema = z.object({
  id: z.string().min(1),
  value: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  description: z.string().trim().max(160).optional().default(""),
});

export const agentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(80).optional().default(""),
  rating: z.number().min(0).max(5).optional().default(5),
  phone: z.string().trim().max(40).optional().default(""),
  imageUrl: z.string().trim().max(500).optional().default(""),
  listingsSold: z.number().int().min(0).optional().default(0),
});

export const testimonialSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(80).optional().default(""),
  quote: z.string().trim().min(1).max(500),
  rating: z.number().min(0).max(5).optional().default(5),
});

export const popularAreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  listingCount: z.number().int().min(0).optional().default(0),
  imageUrl: z.string().trim().max(500).optional().default(""),
});

export const blogPostSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  excerpt: z.string().trim().max(280),
  content: z.string().trim().max(8000).optional().default(""),
  category: z.string().trim().max(40).optional().default("Tips"),
  date: z.string().trim().max(20).optional().default(""),
  imageUrl: z.string().trim().max(500).optional().default(""),
});

export const footerSchema = z.object({
  tagline: z.string().trim().max(240).optional().default(""),
  facebook: z.string().trim().max(200).optional().default(""),
  instagram: z.string().trim().max(200).optional().default(""),
  linkedin: z.string().trim().max(200).optional().default(""),
  youtube: z.string().trim().max(200).optional().default(""),
  privacyUrl: z.string().trim().max(200).optional().default(""),
  termsUrl: z.string().trim().max(200).optional().default(""),
});

export const siteConfigSchema = z.object({
  hero: z.object({
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().trim().max(240).optional().default(""),
    imageUrl: z.string().trim().max(500).optional().default(""),
    ctaPrimary: z.string().trim().max(60).optional().default(""),
    ctaSecondary: z.string().trim().max(60).optional().default(""),
    showSearch: z.boolean().optional().default(false),
  }),
  about: z.string().trim().max(2000).optional().default(""),
  contact: z.object({
    phone: z.string().trim().max(40).optional().default(""),
    email: z.string().trim().max(120).optional().default(""),
    address: z.string().trim().max(240).optional().default(""),
    whatsapp: z.string().trim().max(40).optional().default(""),
    showForm: z.boolean().optional().default(true),
  }),
  listings: z.array(listingSchema).max(48).optional().default([]),
  categories: z.array(categorySchema).max(12).optional().default([]),
  howItWorks: z.array(howItWorksStepSchema).max(6).optional().default([]),
  whyChooseUs: z.array(whyChooseUsItemSchema).max(8).optional().default([]),
  agents: z.array(agentSchema).max(12).optional().default([]),
  testimonials: z.array(testimonialSchema).max(12).optional().default([]),
  popularAreas: z.array(popularAreaSchema).max(12).optional().default([]),
  blogPosts: z.array(blogPostSchema).max(12).optional().default([]),
  mortgage: z
    .object({
      enabled: z.boolean().optional().default(false),
      defaultRate: z.number().min(0).max(30).optional().default(6.5),
      defaultTenorYears: z.number().int().min(1).max(30).optional().default(15),
    })
    .optional()
    .default({ enabled: false, defaultRate: 6.5, defaultTenorYears: 15 }),
  footer: footerSchema.optional().default({}),
  theme: z
    .object({
      accent: z
        .enum([
          "emerald",
          "blue",
          "amber",
          "rose",
          "violet",
          "cyan",
          "orange",
          "teal",
          "red",
          "indigo",
          "fuchsia",
          "lime",
          "slate",
        ])
        .optional()
        .default("emerald"),
      logoUrl: z.string().trim().max(500).optional().default(""),
      customColor: z.string().trim().max(7).optional().default(""),
    })
    .optional()
    .default({ accent: "emerald", logoUrl: "", customColor: "" }),
});

export const createSiteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(64)
    .regex(SLUG_REGEX, "Use lowercase letters, numbers, and hyphens only"),
  config: siteConfigSchema.optional(),
});

export const updateSiteSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  config: siteConfigSchema.optional(),
  isPublished: z.boolean().optional(),
});

export type ListingSpec = z.infer<typeof listingSpecSchema>;
export type PropertyListing = z.infer<typeof listingSchema>;
export type PropertyCategory = z.infer<typeof categorySchema>;
export type HowItWorksStep = z.infer<typeof howItWorksStepSchema>;
export type WhyChooseUsItem = z.infer<typeof whyChooseUsItemSchema>;
export type PropertyAgent = z.infer<typeof agentSchema>;
export type PropertyTestimonial = z.infer<typeof testimonialSchema>;
export type PopularArea = z.infer<typeof popularAreaSchema>;
export type BlogPost = z.infer<typeof blogPostSchema>;
export type PropertyAgencyConfig = z.infer<typeof siteConfigSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

export function mergeSiteConfig(
  partial: unknown,
  name = "Agency"
): PropertyAgencyConfig {
  const base = defaultSiteConfig(name);
  if (!partial || typeof partial !== "object") return base;

  const p = partial as Partial<PropertyAgencyConfig>;
  return siteConfigSchema.parse({
    ...base,
    ...p,
    hero: { ...base.hero, ...p.hero, showSearch: false },
    contact: { ...base.contact, ...p.contact },
    mortgage: { ...base.mortgage, ...p.mortgage },
    footer: { ...base.footer, ...p.footer },
    theme: { ...base.theme, ...p.theme },
    listings: (p.listings ?? base.listings).map((l) => listingSchema.parse(l)),
    categories: p.categories ?? base.categories,
    howItWorks: p.howItWorks ?? base.howItWorks,
    whyChooseUs: p.whyChooseUs ?? base.whyChooseUs,
    agents: p.agents ?? base.agents,
    testimonials: p.testimonials ?? base.testimonials,
    popularAreas: p.popularAreas ?? base.popularAreas,
    blogPosts: (p.blogPosts ?? base.blogPosts).map((post) =>
      blogPostSchema.parse(post)
    ),
  });
}

export function parseSiteConfig(raw: string): PropertyAgencyConfig {
  const parsed = JSON.parse(raw) as unknown;
  return mergeSiteConfig(parsed);
}

export function serializeSiteConfig(config: PropertyAgencyConfig): string {
  return JSON.stringify(siteConfigSchema.parse(config));
}
