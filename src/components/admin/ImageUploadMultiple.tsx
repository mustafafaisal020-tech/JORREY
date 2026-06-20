"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  values: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export default function ImageUploadMultiple({ values, onChange, max = 6 }: Props) {
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
      onChange([...values, data.url]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {values.map((url, i) => (
          <div key={`${url}-${i}`} className="relative aspect-square bg-gray-100 overflow-hidden rounded-sm group">
            <Image src={url} alt="" fill sizes="100px" className="object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-[9px] bg-jorrey-gold text-jorrey-black px-1.5 py-0.5 tracking-widest uppercase font-semibold">
                Main
              </span>
            )}
          </div>
        ))}
        {values.length < max && (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className={cn(
              "aspect-square border border-dashed border-gray-200 rounded-sm flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-jorrey-gold/50 hover:bg-jorrey-beige/30",
              uploading && "opacity-60 pointer-events-none"
            )}
          >
            {uploading ? (
              <p className="text-[10px] text-gray-400">Uploading…</p>
            ) : (
              <>
                <Plus size={16} className="text-gray-400 mb-1" />
                <p className="text-[10px] text-gray-400">Add image</p>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400">First image is the main. Max {max}.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
