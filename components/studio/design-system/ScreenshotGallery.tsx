"use client";

import { useState, useCallback } from "react";
import { X, Plus } from "lucide-react";

interface ScreenshotGalleryProps {
  screenshots: string[];
  onAdd?: (dataUrl: string) => void;
  onDelete?: (index: number) => void;
}

export function ScreenshotGallery({ screenshots, onAdd, onDelete }: ScreenshotGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onAdd) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") onAdd(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [onAdd],
  );

  return (
    <>
      <p className="mb-3 text-[11px] text-[var(--text-muted)]">
        Screenshots are used during layout.md generation to understand page structure and layout patterns.
      </p>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {screenshots.map((src, i) => (
          <div key={i} className="group relative shrink-0">
            <button
              onClick={() => setLightboxIndex(i)}
              className="rounded-lg border border-[var(--studio-border)] overflow-hidden hover:border-[var(--studio-border-strong)] transition-colors"
            >
              <img
                src={src}
                alt={`Screenshot ${i + 1}`}
                className="h-40 w-auto object-cover"
              />
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(i)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all"
                title="Remove screenshot"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}

        {/* Add button */}
        {onAdd && (
          <label className="flex h-40 w-28 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--studio-border)] text-[var(--text-muted)] transition-colors hover:border-[var(--studio-border-strong)] hover:text-[var(--text-secondary)]">
            <div className="flex flex-col items-center gap-1.5">
              <Plus className="h-5 w-5" />
              <span className="text-[10px]">Add</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={screenshots[lightboxIndex]}
            alt={`Screenshot ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
