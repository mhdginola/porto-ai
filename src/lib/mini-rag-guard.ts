import { parseLocale } from "@/lib/i18n/types";

/** Min cosine similarity of top chunk to allow generation. */
export const MIN_RAG_SIMILARITY = 0.32;

const CODE_OR_GENERAL_PATTERNS = [
  /\bhello\s*world\b/i,
  /\b(buatkan|buat|tulis|write|generate|create)\s+(kode|code|script|program)/i,
  /\b(kode|code)\s+(python|javascript|typescript|java|golang|php|ruby)\b/i,
  /\b(python|javascript|typescript)\s+(code|kode|script|program)\b/i,
  /\b(ceritakan|tell)\s+(lelucon|joke|cerita)\b/i,
  /\b(cuaca|weather)\s+(hari ini|today|besok|tomorrow)\b/i,
  /\b(resep|recipe)\s+(masakan|cake|kue)/i,
];

const DOCUMENT_SCOPE_PATTERNS = [
  /\b(pdf|dokumen|document|file)\b/i,
  /\b(ringkas|summarize|summary|ringkasan|kesimpulan|outline)\b/i,
  /\b(isi|konten|content|bab|pasal|ayat|paragraf)\b/i,
  /\b(pojk|peraturan|regulasi|compliance|apu|ppt|pppspm)\b/i,
  /\b(menurut|berdasarkan|disebutkan|dijelaskan)\s+(dokumen|pdf|teks)/i,
  /\b(apa|what|siapa|who|kapan|when|berapa|how many).*(dokumen|pdf|pasal|peraturan)/i,
];

export function miniRagOffTopicMessage(locale?: string | null): string {
  return parseLocale(locale) === "en"
    ? "I can only answer questions about the PDF you uploaded. Please ask something related to that document."
    : "Saya hanya bisa menjawab pertanyaan tentang isi PDF yang Anda unggah. Silakan ajukan pertanyaan terkait dokumen tersebut.";
}

export function isObviouslyOffTopic(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return CODE_OR_GENERAL_PATTERNS.some((re) => re.test(q));
}

export function isDocumentScopedQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return DOCUMENT_SCOPE_PATTERNS.some((re) => re.test(q));
}

/** Whole-document summary requests (always in scope for Mini RAG). */
export function isDocumentSummaryQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  const wantsSummary =
    /\b(ringkas|summarize|summary|ringkasan|kesimpulan|outline|overview)\b/i.test(
      q
    );
  const aboutDoc =
    /\b(isi|dokumen|pdf|document|file|keseluruhan|seluruh|ini|uploaded)\b/i.test(
      q
    ) || /\b(ringkas|summarize|ringkasan)\s+isi\b/i.test(q);
  return wantsSummary && aboutDoc;
}

export function shouldRefuseOffTopic(
  query: string,
  maxSimilarity: number,
  hasChunks: boolean
): boolean {
  if (!query.trim()) return false;

  if (isObviouslyOffTopic(query)) return true;

  if (isDocumentScopedQuery(query)) return false;

  if (!hasChunks) return true;

  return maxSimilarity < MIN_RAG_SIMILARITY;
}
