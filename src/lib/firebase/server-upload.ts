import { getFirebaseConfig } from "@/lib/firebase/config";

type StorageObject = {
  name: string;
  bucket: string;
  downloadTokens?: string;
};

export async function uploadBufferToFirebaseStorage(
  data: Uint8Array,
  path: string,
  contentType: string
): Promise<string> {
  const config = getFirebaseConfig();
  if (!config) {
    throw new Error("Firebase is not configured.");
  }

  const bucket = config.storageBucket;
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: Buffer.from(data),
  });

  const payload = await res.text();

  if (!res.ok) {
    let detail = payload;
    try {
      const parsed = JSON.parse(payload) as { error?: { message?: string } };
      detail = parsed.error?.message ?? payload;
    } catch {
      /* keep raw */
    }
    throw new Error(`Storage upload failed (${res.status}): ${detail}`);
  }

  const json = JSON.parse(payload) as StorageObject;
  const token = json.downloadTokens?.split(",")[0] ?? "";
  const encodedName = encodeURIComponent(json.name);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedName}?alt=media&token=${token}`;
}
