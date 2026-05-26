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

export function miniRagListInstruction(locale?: string | null): string {
  return parseLocale(locale) === "en"
    ? `- For "what does X consist of" / "apa saja" questions: find the lettered list (a., b., c., …) in the context and reproduce EVERY item through the last letter (e.g. through r.) with the correct Pasal reference.
- Never stop early, never replace remaining items with "and others", "dan lainnya", or invented summaries.
- If multiple context blocks belong to the same Pasal/list, combine them before answering.
- Do not substitute a different section (e.g. Pasal 3 pillars when Pasal 2 lists entities). Never invent acronym expansions.`
    : `- Untuk pertanyaan "terdiri atas/dari apa saja": kutip SEMUA butir daftar berhuruf (a., b., … sampai huruf terakhir, mis. r.) persis dari konteks beserta Pasal yang benar.
- Jangan berhenti di tengah, jangan mengganti sisa butir dengan "dan lainnya", "otoritas keuangan lainnya", atau ringkasan buatan.
- Jika ada beberapa blok konteks untuk Pasal/daftar yang sama, gabungkan dulu baru jawab.
- Jangan mengganti dengan pasal lain (mis. 5 pilar Pasal 3). Jangan mengarang kepanjangan singkatan.`;
}

export function miniRagScopeInstruction(locale?: string | null): string {
  return `- You are NOT a general assistant. Decline coding, jokes, weather, recipes, or tasks unrelated to the PDF in one short sentence.
- Do NOT append scope disclaimers or refusal boilerplate after a valid answer drawn from the context.
- Do NOT use outside knowledge. Do NOT write code unless the retrieved context explicitly contains code to explain.`;
}

export function miniRagSummarizeInstruction(locale?: string | null): string {
  return parseLocale(locale) === "en"
    ? `- The user wants a summary of the uploaded PDF. Summarize main themes, Pasal topics, and obligations using ONLY the retrieved context. Summarizing the whole document is in scope — do not refuse.`
    : `- Pengguna meminta ringkasan PDF. Rangkum tema utama, topik Pasal, dan kewajiban hanya dari konteks di bawah. Merangkas seluruh dokumen termasuk ruang lingkup — jangan menolak.`;
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
