"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden rounded-sm">
          <Image src={value} alt="Product" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border border-dashed border-gray-200 rounded-sm aspect-[4/3] flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-jorrey-gold/50 hover:bg-jorrey-beige/30",
            uploading && "opacity-60 pointer-events-none"
          )}
        >
          <Upload size={20} className="text-gray-400 mb-2" />
          <p className="text-xs text-gray-400 tracking-wide">
            {uploading ? "Uploading…" : "Click or drag to upload"}
          </p>
          <p className="text-[10px] text-gray-300 mt-1">JPG, PNG, WEBP · max 5MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
