import { parseLocale } from "@/lib/i18n/types";

export function fitCheckLanguageInstruction(locale?: string | null): string {
  const l = parseLocale(locale);
  if (l === "id") {
    return "Write summary, every strength point + evidence, every gap point + mitigation, and the pitch in Bahasa Indonesia. Keep role.title, keyTech entries, and proper technology names as-is.";
  }
  if (l === "en") {
    return "Write summary, every strength point + evidence, every gap point + mitigation, and the pitch in English.";
  }
  return "Match the language of the job description for summary, strengths, gaps, and pitch.";
}
