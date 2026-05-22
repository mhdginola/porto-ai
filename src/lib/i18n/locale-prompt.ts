import { parseLocale } from "@/lib/i18n/types";

export function chatLanguageInstruction(locale?: string | null): string {
  const l = parseLocale(locale);
  if (l === "id") {
    return "- ALWAYS respond in Bahasa Indonesia (formal but friendly). Use this language even if the user writes in English.";
  }
  if (l === "en") {
    return "- ALWAYS respond in English. Use this language even if the user writes in Bahasa Indonesia.";
  }
  return "- Always answer in the SAME language the user wrote in (Bahasa Indonesia or English).";
}

export function summarizeLanguageInstruction(locale?: string | null): string {
  const l = parseLocale(locale);
  if (l === "id") {
    return "Write the summary in Bahasa Indonesia, even if the input text is in another language.";
  }
  if (l === "en") {
    return "Write the summary in English, even if the input text is in another language.";
  }
  return "Use the SAME language as the input.";
}

export function miniRagNotFoundMessage(locale?: string | null): string {
  return parseLocale(locale) === "en"
    ? "I couldn't find that in the PDF."
    : "Saya tidak menemukan itu di PDF.";
}

export function miniRagLanguageInstruction(locale?: string | null): string {
  const l = parseLocale(locale);
  if (l === "id") {
    return "- ALWAYS respond in Bahasa Indonesia, even if the user writes in English.";
  }
  if (l === "en") {
    return "- ALWAYS respond in English, even if the user writes in Bahasa Indonesia.";
  }
  return "- Answer in the SAME language the user wrote in.";
}
