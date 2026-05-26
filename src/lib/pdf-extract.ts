import { extractText, getDocumentProxy, renderPageAsImage } from "unpdf";
import { getTesseractWorkerOptions } from "@/lib/tesseract-paths";

/** pdf.js VerbosityLevel.ERRORS — hides benign font warnings (e.g. "TT: undefined function: 32"). */
const PDFJS_VERBOSITY_ERRORS_ONLY = 0;

type PdfDocument = Awaited<ReturnType<typeof getDocumentProxy>>;

export type PdfExtractMethod = "text" | "ocr";

export type PdfExtractResult = {
  text: string;
  pageCount: number;
  method: PdfExtractMethod;
};

function normalizeExtractedText(raw: string | string[] | undefined): string {
  const joined = Array.isArray(raw) ? raw.join("\n\n") : (raw ?? "");
  return joined.replace(/\n{3,}/g, "\n\n").trim();
}

async function extractTextFromPdf(pdf: PdfDocument): Promise<string> {
  const merged = await extractText(pdf, { mergePages: true });
  let text = normalizeExtractedText(merged.text);
  if (text) return text;

  const perPage = await extractText(pdf, { mergePages: false });
  return normalizeExtractedText(perPage.text);
}

async function extractViaOcr(pdf: PdfDocument, pageCount: number): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(
    "eng",
    undefined,
    getTesseractWorkerOptions()
  );
  const parts: string[] = [];

  try {
    for (let page = 1; page <= pageCount; page++) {
      const image = await renderPageAsImage(pdf, page, {
        canvasImport: () => import("@napi-rs/canvas"),
        scale: 2,
      });
      const { data } = await worker.recognize(Buffer.from(image));
      const pageText = data.text?.trim();
      if (pageText) parts.push(pageText);
    }
  } finally {
    await worker.terminate();
  }

  return parts.join("\n\n").trim();
}

export function isPdfOcrEnabled(): boolean {
  return process.env.PDF_OCR_FALLBACK !== "false";
}

export async function extractPdfText(
  buffer: Uint8Array
): Promise<PdfExtractResult> {
  const pdf = await getDocumentProxy(buffer, {
    verbosity: PDFJS_VERBOSITY_ERRORS_ONLY,
  });
  const pageCount = pdf.numPages;

  const text = await extractTextFromPdf(pdf);
  if (text) {
    return { text, pageCount, method: "text" };
  }

  if (!isPdfOcrEnabled()) {
    return { text: "", pageCount, method: "text" };
  }

  const ocrText = await extractViaOcr(pdf, pageCount);
  return { text: ocrText, pageCount, method: "ocr" };
}

export function pdfNoTextError(locale?: string): {
  error: string;
  hint: string;
} {
  const isId = locale === "id" || locale?.startsWith("id");
  return {
    error: isId
      ? "Tidak ada teks yang bisa diekstrak dari PDF ini."
      : "No extractable text found in this PDF.",
    hint: isId
      ? "PDF ini kemungkinan hasil ekspor Canva/Figma (hanya gambar). Coba: ekspor ulang dari Word/Google Docs sebagai PDF, atau aktifkan PDF_OCR_FALLBACK=true (OCR otomatis)."
      : "This PDF may be image-only (e.g. Canva export). Re-export from Word/Google Docs, or ensure PDF_OCR_FALLBACK is enabled for OCR.",
  };
}
