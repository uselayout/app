"use client";

import { useState, useCallback } from "react";
import { Sparkles, RotateCw, Figma, Minus, Plus, Download, Wand2, Split } from "lucide-react";

interface ExplorerToolbarProps {
  onGenerate: (prompt: string, variantCount: number) => void;
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

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;
    onGenerate(trimmed, variantCount);
  }, [prompt, variantCount, isGenerating, onGenerate]);

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
    <div className="flex flex-col gap-3 border-b border-[--studio-border] bg-[--bg-panel] p-4">
      {/* Prompt input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Describe what to explore... e.g. &quot;4 variations of a pricing card&quot;"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          className="flex-1 rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          className="inline-flex items-center gap-2 rounded-lg bg-[--studio-accent] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[--studio-accent-hover] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={14} />
          {isGenerating ? "Generating..." : "Explore"}
        </button>
      </div>

      {/* Refine row — visible when a variant is selected */}
      {hasSelection && selectedVariantName && (
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
