import { extractText, getDocumentProxy } from "unpdf";
import { db } from "@/lib/db";
import { playgroundDocuments, type NewPlaygroundDocument } from "@/lib/db/schema";
import { embedBatch } from "@/lib/embeddings";
import { chunkText } from "@/lib/chunker";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PAGES = 50;
const MAX_CHUNKS = 200;

export async function POST(req: Request) {
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
      { status: 413 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Only PDF files are supported" }, { status: 415 });
  }

  let text: string;
  let pageCount = 0;
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    pageCount = pdf.numPages;
    if (pageCount > MAX_PAGES) {
      return Response.json(
        { error: `PDF has too many pages (max ${MAX_PAGES})` },
        { status: 413 }
      );
    }
    const result = await extractText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
  } catch (err) {
    console.error("[mini-rag/upload] PDF parse failed:", err);
    return Response.json(
      { error: "Failed to read PDF (corrupt or image-only?)" },
      { status: 422 }
    );
  }

  const chunks = chunkText(text, 700, 100);
  if (chunks.length === 0) {
    return Response.json(
      { error: "No extractable text found in PDF" },
      { status: 422 }
    );
  }

  const limited = chunks.slice(0, MAX_CHUNKS);

  let embeddings: number[][];
  try {
    embeddings = await embedBatch(limited);
  } catch (err) {
    console.error("[mini-rag/upload] embed failed:", err);
    return Response.json(
      { error: "Embedding service unavailable. Is Ollama running?" },
      { status: 503 }
    );
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
  });
}
