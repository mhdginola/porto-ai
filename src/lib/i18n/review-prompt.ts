import { parseLocale } from "@/lib/i18n/types";

export function reviewSummaryLanguageInstruction(locale?: string | null): string {
  if (parseLocale(locale) === "id") {
    return "Write placeName (or 'Tempat tidak disebutkan' if unknown), verdictLabel, summary, pros, cons, commonThemes, and recommendation in Bahasa Indonesia.";
  }
  if (parseLocale(locale) === "en") {
    return "Write placeName (or 'Place not specified' if unknown), verdictLabel, summary, pros, cons, commonThemes, and recommendation in English.";
  }
  return "Match the dominant language of the pasted reviews for all text fields.";
}
