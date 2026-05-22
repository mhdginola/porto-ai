import { parseLocale } from "@/lib/i18n/types";

export function sentimentLanguageInstruction(locale?: string | null): string {
  if (parseLocale(locale) === "id") {
    return "Write all labels (emotion.label, intent.label), tone, goal, summary, and keywords in Bahasa Indonesia.";
  }
  if (parseLocale(locale) === "en") {
    return "Write all labels, tone, goal, summary, and keywords in English.";
  }
  return "Match the language of the input text for labels, tone, goal, summary, and keywords.";
}
