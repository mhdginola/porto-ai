import { SLUG_REGEX } from "@/lib/property-agency/schemas";

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}
