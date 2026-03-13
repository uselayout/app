"use client";

import { useState, useCallback, useRef } from "react";
import { ArrowUp, RotateCw, Figma, Minus, Plus, Download, Wand2, Split, ImagePlus, X } from "lucide-react";

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
      className="mx-3 mb-3 flex flex-col rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#161718]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Text area */}
      <div className="p-2.5">
        {hasSelection && selectedVariantName ? (
          <div className="relative flex min-h-[68px] items-start rounded-md border border-amber-500/30 bg-amber-500/5 px-3.5 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
            <Wand2 size={14} className="mt-0.5 shrink-0 text-amber-400" />
            <input
              type="text"
              placeholder={`Refine "${selectedVariantName}"... e.g. "make the CTA more prominent"`}
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              onKeyDown={handleRefineKeyDown}
              disabled={isGenerating}
              className="ml-2 flex-1 bg-transparent text-[13px] text-[--text-primary] placeholder:text-amber-400/50 outline-none disabled:opacity-50"
            />
            <button
              onClick={handleRefineSubmit}
              disabled={!refinePrompt.trim() || isGenerating}
              className="absolute bottom-2.5 right-2.5 shrink-0 flex items-center justify-center size-6 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[--text-muted] transition-colors hover:text-[--text-primary] disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ArrowUp size={12} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex min-h-[68px] items-start rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] px-3.5 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
              {/* Image thumbnail chip */}
              {imageDataUrl && (
                <div className="mr-2 flex shrink-0 items-center gap-1.5 rounded-md bg-[--bg-hover] px-1.5 py-0.5" title={imageName ?? "Attached image"}>
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
                className="flex-1 bg-transparent text-[13px] text-[--text-primary] placeholder:text-[#898d94] outline-none disabled:opacity-50"
              />
            </div>

            {/* Bottom-right action buttons */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center justify-center size-6 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[--text-muted] transition-colors hover:text-[--text-secondary] disabled:opacity-40"
                title="Attach reference image"
              >
                <ImagePlus size={12} />
              </button>
              {prompt.trim() && (
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex items-center justify-center size-6 rounded-full bg-[--text-primary] text-[--bg-app] transition-colors hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ArrowUp size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex h-[38px] items-center justify-between border-t border-[rgba(255,255,255,0.05)] px-5 pr-4">
        <div className="flex items-center gap-3">
          {/* Variant count */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[--text-primary]">Variants:</span>
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
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[--text-primary] hover:bg-[--bg-hover] transition-colors disabled:opacity-40"
            >
              <RotateCw size={12} />
              Regenerate
            </button>
          )}

          {/* Compare */}
          <button
            onClick={() => onCompare(prompt.trim())}
            disabled={!prompt.trim() || isGenerating}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[--text-primary] hover:bg-[--bg-hover] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.07)] h-[30px] px-3 text-xs font-medium text-[--text-primary] hover:bg-[--bg-hover] transition-colors disabled:opacity-40"
          >
            <Download size={12} />
            Import from Figma
          </button>
          {hasSelection && (
            <button
              onClick={onPushToFigma}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.07)] h-[30px] px-3 text-xs font-medium text-[--text-primary] hover:bg-[--bg-hover] transition-colors disabled:opacity-40"
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

      const mimeType = ACCEPTED_TYPES.includes(file.type) ? file.type : "image/png";
      resolve(canvas.toDataURL(mimeType, 0.85));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
