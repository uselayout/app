"use client";

import { useState, useCallback, useRef } from "react";
import { Sparkles, RotateCw, Figma, Minus, Plus, Download, Wand2, Split, ImagePlus, X } from "lucide-react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1600;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface ExplorerToolbarProps {
  onGenerate: (prompt: string, variantCount: number, imageDataUrl?: string) => void;
  onRefine: (refinementPrompt: string, variantCount: number) => void;
  onCompare: (prompt: string) => void;
  onRegenerate: () => void;
  onPushToFigma: () => void;
  onImportFromFigma: () => void;
  isGenerating: boolean;
  hasVariants: boolean;
  hasSelection: boolean;
  selectedVariantName?: string;
}

export function ExplorerToolbar({
  onGenerate,
  onRegenerate,
  onRefine,
  onCompare,
  onPushToFigma,
  onImportFromFigma,
  isGenerating,
  hasVariants,
  hasSelection,
  selectedVariantName,
}: ExplorerToolbarProps) {
  const [prompt, setPrompt] = useState("");
  const [refinePrompt, setRefinePrompt] = useState("");
  const [variantCount, setVariantCount] = useState(4);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) return;

    let dataUrl: string;

    if (file.size > MAX_IMAGE_SIZE) {
      // Resize using canvas
      dataUrl = await resizeImage(file);
    } else {
      dataUrl = await fileToDataUrl(file);
    }

    setImageDataUrl(dataUrl);
    setImageName(file.name);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [processFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) processFile(file);
          return;
        }
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = useCallback(() => {
    setImageDataUrl(null);
    setImageName(null);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;
    onGenerate(trimmed, variantCount, imageDataUrl ?? undefined);
    removeImage();
  }, [prompt, variantCount, isGenerating, imageDataUrl, onGenerate, removeImage]);

  const handleRefineSubmit = useCallback(() => {
    const trimmed = refinePrompt.trim();
    if (!trimmed || isGenerating) return;
    onRefine(trimmed, variantCount);
    setRefinePrompt("");
  }, [refinePrompt, variantCount, isGenerating, onRefine]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleRefineKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRefineSubmit();
      }
    },
    [handleRefineSubmit]
  );

  return (
    <div
      className="flex flex-col gap-3 border-t border-[--studio-border] bg-[--bg-panel] p-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Single prompt input — switches between explore and refine mode */}
      {hasSelection && selectedVariantName ? (
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <Wand2 size={14} className="shrink-0 text-amber-400" />
            <input
              type="text"
              placeholder={`Refine "${selectedVariantName}"... e.g. "make the CTA more prominent"`}
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              onKeyDown={handleRefineKeyDown}
              disabled={isGenerating}
              className="flex-1 bg-transparent text-sm text-[--text-primary] placeholder:text-amber-400/50 outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleRefineSubmit}
            disabled={!refinePrompt.trim() || isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Wand2 size={14} />
            Refine
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 focus-within:border-[--studio-border-focus] transition-colors">
            {/* Attach image button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="shrink-0 rounded p-0.5 text-[--text-muted] hover:text-[--text-secondary] transition-colors disabled:opacity-40"
              title="Attach reference image"
            >
              <ImagePlus size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image thumbnail chip */}
            {imageDataUrl && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-[--bg-hover] px-1.5 py-0.5" title={imageName ?? "Attached image"}>
                <img
                  src={imageDataUrl}
                  alt="Reference"
                  className="h-6 w-6 rounded object-cover"
                />
                <button
                  onClick={removeImage}
                  className="rounded p-0.5 text-[--text-muted] hover:text-[--text-primary] transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Text input */}
            <input
              ref={promptInputRef}
              type="text"
              placeholder={imageDataUrl
                ? "Describe how to use this reference... e.g. \"redesign this using our design system\""
                : "Describe what to explore... e.g. \"a pricing card with feature tiers\""
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={isGenerating}
              className="flex-1 bg-transparent text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-[--studio-accent] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[--studio-accent-hover] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={14} />
            {isGenerating ? "Generating..." : "Explore"}
          </button>
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Variant count */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[--text-secondary]">Variants:</span>
            <button
              onClick={() => setVariantCount((c) => Math.max(2, c - 1))}
              disabled={variantCount <= 2 || isGenerating}
              className="rounded p-0.5 text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors disabled:opacity-30"
            >
              <Minus size={12} />
            </button>
            <span className="w-4 text-center text-xs font-medium text-[--text-primary]">
              {variantCount}
            </span>
            <button
              onClick={() => setVariantCount((c) => Math.min(6, c + 1))}
              disabled={variantCount >= 6 || isGenerating}
              className="rounded p-0.5 text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors disabled:opacity-30"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Regenerate */}
          {hasVariants && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors disabled:opacity-40"
            >
              <RotateCw size={12} />
              Regenerate
            </button>
          )}

          {/* Compare */}
          <button
            onClick={() => onCompare(prompt.trim())}
            disabled={!prompt.trim() || isGenerating}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Compare with vs without design system"
          >
            <Split size={12} />
            Compare
          </button>
        </div>

        {/* Figma actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onImportFromFigma}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors disabled:opacity-40"
          >
            <Download size={12} />
            Import from Figma
          </button>
          {hasSelection && (
            <button
              onClick={onPushToFigma}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-1.5 text-xs font-medium text-[--text-primary] hover:bg-[--bg-hover] transition-colors disabled:opacity-40"
            >
              <Figma size={12} />
              Push to Figma
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to same type or fallback to PNG
      const mimeType = ACCEPTED_TYPES.includes(file.type) ? file.type : "image/png";
      resolve(canvas.toDataURL(mimeType, 0.85));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
