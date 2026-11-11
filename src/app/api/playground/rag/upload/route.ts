import { db } from "@/lib/db";
import {
  playgroundDocuments,
  type NewPlaygroundDocument,
} from "@/lib/db/schema";
import { EMBEDDINGS_ENABLED } from "@/lib/ai";
import { embedBatch, formatEmbeddingError } from "@/lib/embeddings";
import { chunkText } from "@/lib/chunker";
import {
  extractPdfText,
  PdfTooManyPagesError,
  isPdfOcrEnabled,
  pdfNoTextError,
} from "@/lib/pdf-extract";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_PAGES = 150;
const MAX_CHUNKS = 600;

export async function POST(req: Request) {
  const throttled = await rateLimit(req, POLICIES.pdfUpload);
  if (throttled) return throttled;
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing 'file' field" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
      { status: 413 },
    );
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json(
      { error: "Only PDF files are supported" },
      { status: 415 },
    );
  }

  const locale =
    typeof formData.get("locale") === "string"
      ? String(formData.get("locale"))
      : undefined;

  let pageCount = 0;
  let extractionMethod: "text" | "ocr" = "text";
  let text = "";

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    // Rejects oversized PDFs before any (expensive) text extraction / OCR.
    const result = await extractPdfText(buffer, { maxPages: MAX_PAGES });
    text = result.text;
    pageCount = result.pageCount;
    extractionMethod = result.method;
  } catch (err) {
    if (err instanceof PdfTooManyPagesError) {
      return Response.json(
        { error: `PDF has too many pages (max ${MAX_PAGES})` },
        { status: 413 },
      );
    }
    console.error("[mini-rag/upload] PDF parse failed:", err);
    return Response.json(
      { error: "Failed to read PDF (corrupt or unsupported?)" },
      { status: 422 },
    );
  }

  const chunks = chunkText(text, 1000, 120);
  if (chunks.length === 0) {
    const { error, hint } = pdfNoTextError(locale);
    return Response.json(
      {
        error,
        hint,
        code: "PDF_NO_TEXT",
        ocrEnabled: isPdfOcrEnabled(),
      },
      { status: 422 },
    );
  }

  const limited = chunks.slice(0, MAX_CHUNKS);

  // Embeddings are optional: without a provider (or if it fails) the PDF is
  // stored for keyword (full-text) search only, instead of rejecting the upload.
  let embeddings: (number[] | null)[] = limited.map(() => null);
  let searchMode: "hybrid" | "keyword" = "keyword";
  if (EMBEDDINGS_ENABLED) {
    try {
      embeddings = await embedBatch(limited);
      searchMode = "hybrid";
    } catch (err) {
      console.warn(
        "[mini-rag/upload] embedding failed, falling back to keyword search:",
        formatEmbeddingError(err),
      );
    }
  }

  const sessionId = crypto.randomUUID();
  const rows: NewPlaygroundDocument[] = limited.map((content, i) => ({
    sessionId,
    filename: file.name,
    chunkIndex: i,
    content,
    embedding: embeddings[i],
  }));

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(playgroundDocuments).values(rows.slice(i, i + BATCH));
  }

  return Response.json({
    sessionId,
    filename: file.name,
    chunks: rows.length,
    pageCount,
    truncated: chunks.length > MAX_CHUNKS,
    extractionMethod,
    searchMode,
  });
}
