"use client";

const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 60_000;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function uploadPropertyAgencyImage(
  file: File,
  siteSlug: string,
  prefix: string
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("siteSlug", siteSlug);
  form.append("prefix", prefix);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const res = await fetch("/api/projects/property-agency/upload", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const data = (await res.json()) as { url?: string; error?: string };

    if (!res.ok || !data.url) {
      throw new Error(data.error ?? "Upload failed");
    }

    return data.url;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Upload timed out. Try a smaller image or check Firebase Storage.");
    }
    throw e instanceof Error ? e : new Error("Upload failed");
  } finally {
    window.clearTimeout(timer);
  }
}
