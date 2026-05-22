export type Locale = "en" | "id";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "porto-locale";
export const LOCALE_COOKIE = "porto-locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "id";
}

export function parseLocale(value?: string | null): Locale | undefined {
  if (isLocale(value)) return value;
  return undefined;
}
