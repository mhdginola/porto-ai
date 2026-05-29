"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { isFirebaseStorageConfigured } from "@/lib/firebase/config";
import { uploadPropertyAgencyImage } from "@/lib/firebase/upload-image";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
  siteSlug: string;
  uploadPrefix: string;
  inputClass?: string;
  uploadLabel: string;
  uploadingLabel: string;
  orPasteUrlLabel: string;
  notConfiguredLabel: string;
};

export function ImageUploadField({
  value,
  onChange,
  siteSlug,
  uploadPrefix,
  inputClass,
  uploadLabel,
  uploadingLabel,
  orPasteUrlLabel,
  notConfiguredLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const configured = isFirebaseStorageConfigured();

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadPropertyAgencyImage(file, siteSlug, uploadPrefix);
      onChange(url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-foreground/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-32 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-foreground/15 bg-background/90 text-foreground/70 hover:text-foreground"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {configured ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? uploadingLabel : uploadLabel}
          </Button>
          <span className="text-[11px] text-foreground/40">{orPasteUrlLabel}</span>
        </div>
      ) : (
        <p className="text-[11px] text-amber-500/90">{notConfiguredLabel}</p>
      )}

      <input
        className={cn(inputClass, "font-mono text-xs")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
      />

      {uploadError ? (
        <p className="text-xs text-red-400">{uploadError}</p>
      ) : null}
    </div>
  );
}
