import { z } from "zod";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const listingSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(120),
  price: z.number().int().min(0),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area: z.number().int().min(0),
  type: z.string().trim().min(1).max(40),
  imageUrl: z.string().trim().max(500).optional().default(""),
});

export const siteConfigSchema = z.object({
  hero: z.object({
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().trim().max(240).optional().default(""),
    imageUrl: z.string().trim().max(500).optional().default(""),
  }),
  about: z.string().trim().max(2000).optional().default(""),
  contact: z.object({
    phone: z.string().trim().max(40).optional().default(""),
    email: z.string().trim().max(120).optional().default(""),
    address: z.string().trim().max(240).optional().default(""),
  }),
  listings: z.array(listingSchema).max(24).optional().default([]),
  theme: z
    .object({
      accent: z.enum(["emerald", "blue", "amber"]).optional().default("emerald"),
    })
    .optional()
    .default({ accent: "emerald" }),
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

export type PropertyListing = z.infer<typeof listingSchema>;
export type PropertyAgencyConfig = z.infer<typeof siteConfigSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

export function parseSiteConfig(raw: string): PropertyAgencyConfig {
  const parsed = JSON.parse(raw) as unknown;
  return siteConfigSchema.parse(parsed);
}

export function serializeSiteConfig(config: PropertyAgencyConfig): string {
  return JSON.stringify(siteConfigSchema.parse(config));
}
