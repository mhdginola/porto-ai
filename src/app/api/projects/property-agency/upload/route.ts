import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { uploadBufferToFirebaseStorage } from "@/lib/firebase/server-upload";
import { getFirebaseConfig } from "@/lib/firebase/config";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extForType(type: string): string {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

async function saveLocalUpload(
  data: Uint8Array,
  siteSlug: string,
  filename: string
): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", "property-agency", siteSlug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), data);
  return `/uploads/property-agency/${siteSlug}/${filename}`;
}

export async function POST(req: Request) {
  if (!getFirebaseConfig()) {
    return Response.json(
      { error: "Firebase is not configured in environment variables." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  const siteSlug = String(form.get("siteSlug") ?? "").trim();
  const prefix = String(form.get("prefix") ?? "image").trim();

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  if (!siteSlug) {
    return Response.json({ error: "Missing site slug." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
  }

  const safeSlug = siteSlug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const safePrefix = prefix.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
  const filename = `${safePrefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extForType(file.type)}`;
  const objectPath = `property-agency/${safeSlug}/${filename}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  try {
    const url = await uploadBufferToFirebaseStorage(buffer, objectPath, file.type);
    return Response.json({ url, storage: "firebase" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const useLocal =
      message.includes("404") ||
      message.includes("Not Found") ||
      message.includes("storage/unauthorized");

    if (useLocal) {
      try {
        const url = await saveLocalUpload(buffer, safeSlug, filename);
        return Response.json({
          url,
          storage: "local",
          warning:
            "Firebase Storage unavailable — saved locally. Enable Storage in Firebase Console for cloud URLs.",
        });
      } catch (localErr) {
        console.error("[property-agency] local upload failed:", localErr);
      }
    }

    console.error("[property-agency] upload failed:", err);
    return Response.json(
      {
        error:
          "Upload failed. Enable Firebase Storage in Firebase Console, or check rules for property-agency/*.",
      },
      { status: 500 }
    );
  }
}
