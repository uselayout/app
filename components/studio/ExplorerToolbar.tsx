"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowUp, RotateCw, Figma, Minus, Plus, Download, Wand2, Split, ImagePlus, Paperclip, X, ChevronDown, KeyRound } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PaperIcon } from "@/components/studio/PaperPushModal";
import type { ContextFile, AiModelId } from "@/lib/types";
import { AI_MODELS, BYOK_ONLY_MODELS } from "@/lib/types";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1600;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_CONTEXT_FILE_SIZE = 50 * 1024; // 50KB
const MAX_CONTEXT_FILES = 3;
const ACCEPTED_TEXT_TYPES = ".md,.txt,.json,.css,.html,.tsx,.ts,.jsx,.js";

interface ExplorerToolbarProps {
  onGenerate: (prompt: string, variantCount: number, imageDataUrl?: string, contextFiles?: ContextFile[]) => void;
  onRefine: (refinementPrompt: string, variantCount: number, imageDataUrl?: string, contextFiles?: ContextFile[]) => void;
  onCompare: (prompt: string, imageDataUrl?: string, contextFiles?: ContextFile[]) => void;
  onRegenerate: () => void;
  onPushToFigma: () => void;
  onPushToPaper: () => void;
  onImportFromFigma: () => void;
  isGenerating: boolean;
  hasVariants: boolean;
  hasSelection: boolean;
  selectedVariantName?: string;
  /** Current exploration prompt — used to pre-fill on regenerate */
  currentPrompt?: string;
  /** Pre-loaded reference image (e.g. from Figma push-to-canvas) */
  initialImage?: string;
  /** Currently selected AI model */
  modelId: AiModelId;
  /** Callback when user switches model */
  onModelChange: (modelId: AiModelId) => void;
  /** Whether the user has a Google API key configured */
  hasGoogleKey: boolean;
  /** Whether the user has an Anthropic API key configured */
  hasAnthropicKey: boolean;
}

export function ExplorerToolbar({
  onGenerate,
  onRegenerate: _onRegenerate,
  onRefine,
  onCompare,
  onPushToFigma,
  onPushToPaper,
  onImportFromFigma,
  isGenerating,
  hasVariants,
  hasSelection,
  selectedVariantName,
  currentPrompt,
  initialImage,
  modelId,
  onModelChange,
  hasGoogleKey,
  hasAnthropicKey,
}: ExplorerToolbarProps) {
  const params = useParams();
  const orgSlug = (params?.org as string) ?? "";
  const [prompt, setPrompt] = useState("");
  const [refinePrompt, setRefinePrompt] = useState("");
  const [variantCount, setVariantCount] = useState(2);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextFileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  // Clear prompt when switching between explorations
  // (don't pre-fill — Regenerate button handles that explicitly)
  useEffect(() => {
    setPrompt("");
  }, [currentPrompt]);

  // Pre-populate with push-to-canvas image (always accept new images)
  useEffect(() => {
    if (initialImage) {
      setImageDataUrl(initialImage);
      setImageName("Captured screenshot");
    }
  }, [initialImage]);

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

  const handleContextFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      setFileError(null);

      const remaining = MAX_CONTEXT_FILES - contextFiles.length;
      if (remaining <= 0) {
        setFileError(`Maximum ${MAX_CONTEXT_FILES} files allowed`);
        e.target.value = "";
        return;
      }

      const toProcess = Array.from(files).slice(0, remaining);
      for (const file of toProcess) {
        if (file.size > MAX_CONTEXT_FILE_SIZE) {
          setFileError(`${file.name} exceeds 50KB limit`);
          continue;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setContextFiles((prev) => {
            if (prev.length >= MAX_CONTEXT_FILES) return prev;
            if (prev.some((f) => f.name === file.name)) return prev;
            return [...prev, { name: file.name, content: reader.result as string }];
          });
        };
        reader.readAsText(file);
      }
      e.target.value = "";
    },
    [contextFiles.length]
  );

  const removeContextFile = useCallback((name: string) => {
    setContextFiles((prev) => prev.filter((f) => f.name !== name));
    setFileError(null);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;
    onGenerate(trimmed, variantCount, imageDataUrl ?? undefined, contextFiles.length > 0 ? contextFiles : undefined);
    removeImage();
    setContextFiles([]);
    setFileError(null);
  }, [prompt, variantCount, isGenerating, imageDataUrl, contextFiles, onGenerate, removeImage]);

  const handleRefineSubmit = useCallback(() => {
    const trimmed = refinePrompt.trim();
    if (!trimmed || isGenerating) return;
    onRefine(trimmed, variantCount, imageDataUrl ?? undefined, contextFiles.length > 0 ? contextFiles : undefined);
    setRefinePrompt("");
    removeImage();
    setContextFiles([]);
    setFileError(null);
  }, [refinePrompt, variantCount, isGenerating, imageDataUrl, contextFiles, onRefine, removeImage]);

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
      className="mx-3 mb-3 flex flex-col rounded-lg border border-[rgba(255,255,255,0.12)] bg-[var(--bg-surface)]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Hidden file inputs — shared by both generate and refine modes */}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
      <input ref={contextFileInputRef} type="file" accept={ACCEPTED_TEXT_TYPES} onChange={handleContextFileChange} multiple className="hidden" />

      {/* Text area */}
      <div className="p-2.5">
        {hasSelection && selectedVariantName ? (
          <div className="relative">
            <div className="flex min-h-[68px] items-start rounded-md border border-amber-500/30 bg-amber-500/5 px-3.5 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
              <Wand2 size={14} className="mt-0.5 shrink-0 text-amber-400" />
              {/* Image chip */}
              {imageDataUrl && (
                <div className="ml-2 mr-1 flex shrink-0 items-center gap-1.5 rounded-md bg-[var(--bg-hover)] px-1.5 py-0.5" title={imageName ?? "Attached image"}>
                  <img src={imageDataUrl} alt="Reference" className="h-6 w-6 rounded object-cover" />
                  <button onClick={removeImage} className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <X size={10} />
                  </button>
                </div>
              )}
              {/* Context file chips */}
              {contextFiles.length > 0 && (
                <div className="ml-2 mr-1 flex shrink-0 items-center gap-1">
                  {contextFiles.map((f) => (
                    <div key={f.name} className="flex items-center gap-1 rounded-md bg-[var(--bg-hover)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]" title={`${f.name} (${(f.content.length / 1024).toFixed(1)}KB)`}>
                      <Paperclip size={9} />
                      <span className="max-w-[80px] truncate">{f.name}</span>
                      <button onClick={() => removeContextFile(f.name)} className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="text"
                placeholder={`Refine "${selectedVariantName}"... e.g. "make the CTA more prominent"`}
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                onKeyDown={handleRefineKeyDown}
                onPaste={handlePaste}
                disabled={isGenerating}
                className="ml-2 flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-amber-400/50 outline-none disabled:opacity-50"
              />
            </div>
            {fileError && (
              <p className="mt-1 text-[10px] text-red-400 px-1">{fileError}</p>
            )}
            {/* Bottom-right action buttons */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button
                onClick={() => contextFileInputRef.current?.click()}
                disabled={isGenerating || contextFiles.length >= MAX_CONTEXT_FILES}
                className="flex items-center justify-center size-6 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[var(--text-muted)] transition-colors hover:text-amber-400/60 disabled:opacity-40"
                title={contextFiles.length >= MAX_CONTEXT_FILES ? `Maximum ${MAX_CONTEXT_FILES} files` : "Attach context files"}
              >
                <Paperclip size={12} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center justify-center size-6 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[var(--text-muted)] transition-colors hover:text-amber-400/60 disabled:opacity-40"
                title="Attach reference image"
              >
                <ImagePlus size={12} />
              </button>
              <button
                onClick={handleRefineSubmit}
                disabled={!refinePrompt.trim() || isGenerating}
                className="flex items-center justify-center size-6 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ArrowUp size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="flex min-h-[68px] items-start rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] px-3.5 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
              {/* Image thumbnail chip */}
              {imageDataUrl && (
                <div className="mr-2 flex shrink-0 items-center gap-1.5 rounded-md bg-[var(--bg-hover)] px-1.5 py-0.5" title={imageName ?? "Attached image"}>
                  <img
                    src={imageDataUrl}
                    alt="Reference"
                    className="h-6 w-6 rounded object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {/* Context file chips */}
              {contextFiles.length > 0 && (
                <div className="mr-2 flex shrink-0 items-center gap-1">
                  {contextFiles.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-1 rounded-md bg-[var(--bg-hover)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]"
                      title={`${f.name} (${(f.content.length / 1024).toFixed(1)}KB)`}
                    >
                      <Paperclip size={9} />
                      <span className="max-w-[80px] truncate">{f.name}</span>
                      <button
                        onClick={() => removeContextFile(f.name)}
                        className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Text input */}
              <input
                ref={promptInputRef}
                type="text"
                placeholder={imageDataUrl
                  ? "Describe how to use this reference... e.g. \"redesign this using our design system\""
                  : contextFiles.length > 0
                  ? "Describe what to build with these files as context..."
                  : "Describe what to explore... e.g. \"a pricing card with feature tiers\""
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isGenerating}
                className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none disabled:opacity-50"
              />
            </div>

            {/* File error */}
            {fileError && (
              <p className="mt-1 text-[10px] text-red-400 px-1">{fileError}</p>
            )}

            {/* Bottom-right action buttons */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button
                onClick={() => contextFileInputRef.current?.click()}
                disabled={isGenerating || contextFiles.length >= MAX_CONTEXT_FILES}
                className="flex items-center justify-center size-6 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)] disabled:opacity-40"
                title={contextFiles.length >= MAX_CONTEXT_FILES ? `Maximum ${MAX_CONTEXT_FILES} files` : "Attach context files (.md, .txt, .css, etc.)"}
              >
                <Paperclip size={12} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center justify-center size-6 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)] disabled:opacity-40"
                title="Attach reference image"
              >
                <ImagePlus size={12} />
              </button>
              {prompt.trim() && (
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex items-center justify-center size-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-app)] transition-colors hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed"
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
            <span className="text-xs text-[var(--text-primary)]">Variants:</span>
            <button
              onClick={() => setVariantCount((c) => Math.max(1, c - 1))}
              disabled={variantCount <= 1 || isGenerating}
              className="rounded p-0.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30"
            >
              <Minus size={12} />
            </button>
            <span className="w-4 text-center text-xs font-medium text-[var(--text-primary)]">
              {variantCount}
            </span>
            <button
              onClick={() => setVariantCount((c) => Math.min(6, c + 1))}
              disabled={variantCount >= 6 || isGenerating}
              className="rounded p-0.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Model selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-primary)]">Model:</span>
            <div className="relative">
              <select
                value={modelId}
                onChange={(e) => onModelChange(e.target.value as AiModelId)}
                disabled={isGenerating}
                className="appearance-none rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] pl-2 pr-6 py-0.5 text-xs text-[var(--text-primary)] outline-none transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-40 cursor-pointer"
              >
                {Object.values(AI_MODELS).map((m) => {
                  const isByokOnly = BYOK_ONLY_MODELS.has(m.id as AiModelId);
                  const needsKey = m.provider === "gemini"
                    ? !hasGoogleKey
                    : isByokOnly && !hasAnthropicKey;
                  return (
                    <option
                      key={m.id}
                      value={m.id}
                      disabled={needsKey}
                    >
                      {m.label}{needsKey ? " (own key)" : ""}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
            {(!hasAnthropicKey || !hasGoogleKey) && orgSlug && (
              <Link
                href={`/${orgSlug}/settings/api-keys`}
                className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
              >
                <KeyRound size={10} />
                Add keys
              </Link>
            )}
          </div>

          {/* Regenerate — pre-fills prompt and focuses input */}
          {hasVariants && (
            <button
              onClick={() => {
                if (currentPrompt) setPrompt(currentPrompt);
                promptInputRef.current?.focus();
              }}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40"
            >
              <RotateCw size={12} />
              Regenerate
            </button>
          )}

          {/* Compare */}
          <button
            onClick={() => onCompare(prompt.trim(), imageDataUrl ?? undefined, contextFiles.length > 0 ? contextFiles : undefined)}
            disabled={!prompt.trim() || isGenerating}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.07)] h-[30px] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40"
          >
            <Download size={12} />
            Import from Figma
          </button>
          {hasSelection && (
            <>
              <button
                onClick={onPushToFigma}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.07)] h-[30px] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40"
              >
                <Figma size={12} />
                Push to Figma
              </button>
              <button
                onClick={onPushToPaper}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.07)] h-[30px] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40"
              >
                <PaperIcon size={12} />
                Push to Paper
              </button>
            </>
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
