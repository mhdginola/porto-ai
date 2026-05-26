/** Split long text on sentence boundaries with overlap. */
function chunkBySentences(text: string, maxLen: number, overlap: number): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > maxLen) {
      if (current) chunks.push(current.trim());
      const tail = current.slice(Math.max(0, current.length - overlap));
      current = (tail + " " + sentence).trim();
    } else {
      current = (current + " " + sentence).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

/** Split at lettered list items (a. b. c.) to keep enumerations intact. */
function chunkByListItems(text: string, maxLen: number, overlap: number): string[] {
  const parts = text.split(/(?=\s[a-z]\.\s)/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return chunkBySentences(text, maxLen, overlap);

  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    if ((current + " " + part).trim().length > maxLen) {
      if (current) chunks.push(current.trim());
      const tail = current.slice(Math.max(0, current.length - overlap));
      current = (tail + " " + part).trim();
      if (current.length > maxLen) {
        chunks.push(...chunkBySentences(current, maxLen, overlap));
        current = "";
      }
    } else {
      current = (current + " " + part).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

function isListHeavy(text: string): boolean {
  const items = text.match(/\s[a-z]\.\s/gi);
  return (items?.length ?? 0) >= 8;
}

function chunkBlock(text: string, maxLen: number, overlap: number): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  // Stay under nomic-embed-text 2048-token limit (~1400 chars safe per chunk).
  const limit = isListHeavy(clean) ? Math.min(Math.max(maxLen, 1100), 1400) : maxLen;
  if (clean.length <= limit) return [clean];
  if (/\s[a-z]\.\s/.test(clean)) {
    return chunkByListItems(clean, limit, overlap);
  }
  return chunkBySentences(clean, limit, overlap);
}

/**
 * Prefer splitting on "Pasal N" boundaries (Indonesian legal docs) so
 * enumerations like Pasal 2 (a. bank … r. …) stay in fewer chunks.
 */
export function chunkText(text: string, maxLen = 1100, overlap = 120): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const pasalBlocks = normalized.split(/(?=Pasal\s+\d+)/i);
  if (pasalBlocks.length > 1) {
    const chunks: string[] = [];
    for (const block of pasalBlocks) {
      chunks.push(...chunkBlock(block, maxLen, overlap));
    }
    return chunks.filter(Boolean);
  }

  return chunkBlock(normalized.replace(/\s+/g, " "), maxLen, overlap);
}
