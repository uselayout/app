"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ThumbsUp, ThumbsDown, Copy, RotateCw, Figma, Monitor, BookMarked, ArrowUp, ImagePlus, GitCompareArrows, Trash2, MousePointer2 } from "lucide-react";
import { extractComponentName, buildSrcdoc, sanitizeRelativeSrc } from "@/lib/explore/preview-helpers";
import { getInspectorScript } from "@/lib/explore/inspector-script";
import { pushManualEdit, pushRollback, undoLastEdit } from "@/lib/explore/edit-history";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ElementInspector } from "@/components/studio/ElementInspector";
import { EditHistoryPanel } from "@/components/studio/EditHistoryPanel";
import type { DesignVariant, StyleEdit, EditEntry, EditHistory } from "@/lib/types";

function Tip({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <TooltipPrimitive.Root delayDuration={wide ? 300 : undefined}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          sideOffset={6}
          className={`z-50 rounded-md bg-[var(--bg-elevated)] border border-[var(--studio-border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] animate-in fade-in-0 zoom-in-95 ${wide ? "max-w-xs whitespace-normal leading-relaxed" : ""}`}
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

interface VariantCardProps {
  variant: DesignVariant;
  isSelected: boolean;
  onSelect: () => void;
  onRate: (rating: "up" | "down") => void;
  onCopyCode: () => void;
  onPushToFigma: () => void;
  onRegenerate: (feedback?: string) => void;
  onResponsive?: () => void;
  onPromoteToLibrary?: () => void;
  onRegenerateImages?: () => void;
  isProcessingImages?: boolean;
  onViewComparison?: () => void;
  comparisonCount?: number;
  onDelete?: () => void;
  onCodeUpdate?: (code: string, editHistory: EditHistory) => void;
  layoutMd?: string;
}

export function VariantCard({
  variant,
  isSelected,
  onSelect,
  onRate,
  onCopyCode,
  onPushToFigma,
  onRegenerate,
  onResponsive,
  onPromoteToLibrary,
  onRegenerateImages,
  isProcessingImages,
  onViewComparison,
  comparisonCount = 0,
  onDelete,
  onCodeUpdate,
  layoutMd,
}: VariantCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const refineInputRef = useRef<HTMLInputElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [inspectMode, setInspectMode] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [previewEntryId, setPreviewEntryId] = useState<string | undefined>();

  const editHistory = variant.editHistory ?? [];

  // Transpile and render
  useEffect(() => {
    if (!variant.code) return;
    setPreviewReady(false);
    setPreviewError(null);

    let cancelled = false;

    async function transpileAndRender() {
      try {
        const res = await fetch("/api/transpile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: sanitizeRelativeSrc(variant.code) }),
        });

        if (!res.ok) {
          setPreviewError("Transpilation failed");
          return;
        }

        const { js } = await res.json();
        if (cancelled) return;

        const componentName = extractComponentName(variant.code);
        const srcdoc = buildSrcdoc(
          js,
          componentName,
          inspectMode ? getInspectorScript() : undefined
        );

        if (iframeRef.current) {
          iframeRef.current.srcdoc = srcdoc;
          setPreviewReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewError(err instanceof Error ? err.message : "Preview failed");
        }
      }
    }

    transpileAndRender();
    return () => { cancelled = true; };
  }, [variant.code, inspectMode]);

  // Keyboard shortcut: Cmd+Z for undo
  useEffect(() => {
    if (!inspectMode || !onCodeUpdate) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const { history: newHistory, restoredCode } = undoLastEdit(editHistory);
        if (restoredCode !== null) {
          onCodeUpdate!(restoredCode, newHistory);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectMode, editHistory, onCodeUpdate]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(variant.code);
    onCopyCode();
  }, [variant.code, onCopyCode]);

  const handleStyleEdits = useCallback(async (edits: StyleEdit[]) => {
    if (!onCodeUpdate || edits.length === 0) return;
    setIsApplying(true);

    try {
      const res = await fetch("/api/generate/apply-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: variant.code,
          styleEdits: edits,
          layoutMd,
        }),
      });

      if (!res.ok) {
        console.error("Style edit failed:", await res.text());
        return;
      }

      const { code: updatedCode } = await res.json();
      const description = edits
        .map((e) => `${e.property}: ${e.before} → ${e.after}`)
        .join(", ");
      const newHistory = pushManualEdit(
        editHistory,
        variant.code,
        updatedCode,
        edits,
        description
      );
      onCodeUpdate(updatedCode, newHistory);
    } catch (err) {
      console.error("Style edit error:", err);
    } finally {
      setIsApplying(false);
    }
  }, [variant.code, editHistory, onCodeUpdate, layoutMd]);

  const handleHistoryRestore = useCallback((entry: EditEntry) => {
    if (!onCodeUpdate) return;
    const newHistory = pushRollback(editHistory, variant.code, entry);
    onCodeUpdate(entry.codeAfter, newHistory);
    setPreviewEntryId(undefined);
  }, [variant.code, editHistory, onCodeUpdate]);

  const handleHistoryPreview = useCallback(async (entry: EditEntry) => {
    setPreviewEntryId(entry.id);
    // Temporarily render the historical code in the iframe
    try {
      const res = await fetch("/api/transpile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sanitizeRelativeSrc(entry.codeAfter) }),
      });
      if (!res.ok) return;
      const { js } = await res.json();
      const componentName = extractComponentName(entry.codeAfter);
      const srcdoc = buildSrcdoc(js, componentName);
      if (iframeRef.current) {
        iframeRef.current.srcdoc = srcdoc;
      }
    } catch {
      // silently fail preview
    }
  }, []);

  const toggleInspectMode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectMode((prev) => !prev);
    setPreviewEntryId(undefined);
  }, []);

  const healthBadge = variant.healthScore ? (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        variant.healthScore.total >= 80
          ? "bg-emerald-500/20 text-emerald-400"
          : variant.healthScore.total >= 50
            ? "bg-amber-500/20 text-amber-400"
            : "bg-red-500/20 text-red-400"
      }`}
    >
      {variant.healthScore.total}
    </span>
  ) : null;

  return (
    <TooltipProvider>
    <div
      onClick={inspectMode ? undefined : onSelect}
      className={`group relative flex flex-col rounded-xl border transition-all ${inspectMode ? "" : "cursor-pointer"} ${
        isSelected
          ? "border-[var(--studio-accent)] ring-1 ring-[var(--studio-accent)]/30 bg-[var(--bg-elevated)]"
          : "border-[var(--studio-border)] bg-[var(--bg-surface)] hover:border-[var(--studio-border-strong)]"
      }`}
    >
      {/* Selection indicator */}
      {isSelected && !inspectMode && (
        <div className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--studio-accent)]">
          <Check size={12} className="text-[var(--text-on-accent)]" />
        </div>
      )}

      {/* Inspect mode indicator */}
      {inspectMode && (
        <div className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
          <MousePointer2 size={10} className="text-white" />
        </div>
      )}

      {/* Applying overlay */}
      {isApplying && (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-xl bg-black/40">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--studio-border)] px-3 py-2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
            <span className="text-[10px] text-[var(--text-secondary)]">Applying changes...</span>
          </div>
        </div>
      )}

      {/* Preview area */}
      <div ref={previewContainerRef} className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white">
        {previewError ? (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-xs text-red-400">{previewError}</p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            className={`h-full w-full origin-top-left scale-50 border-0 transition-opacity ${
              previewReady ? "opacity-100" : "opacity-0"
            }`}
            style={{ width: "200%", height: "200%", pointerEvents: inspectMode ? "auto" : "none" }}
            title={`Preview: ${variant.name}`}
          />
        )}
        {!previewReady && !previewError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
          </div>
        )}

        {/* Element Inspector popover — rendered inside the preview area */}
        <ElementInspector
          iframeRef={iframeRef}
          containerRef={previewContainerRef}
          isActive={inspectMode}
          onStyleEdits={handleStyleEdits}
          onDeselect={() => {}}
          iframeScale={0.5}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
            {variant.name}
          </h3>
          {healthBadge}
        </div>
        {variant.rationale && (
          <Tip label={variant.rationale} wide>
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 cursor-default">
              {variant.rationale}
            </p>
          </Tip>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 border-t border-[var(--studio-border)] px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tip label="Good">
        <button
          onClick={(e) => { e.stopPropagation(); onRate("up"); }}
          className={`rounded p-1 transition-colors ${
            variant.rating === "up"
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          <ThumbsUp size={12} />
        </button>
        </Tip>
        <Tip label="Bad">
        <button
          onClick={(e) => { e.stopPropagation(); onRate("down"); }}
          className={`rounded p-1 transition-colors ${
            variant.rating === "down"
              ? "text-red-400 bg-red-500/10"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          <ThumbsDown size={12} />
        </button>
        </Tip>
        {onDelete && isSelected && (
          <Tip label="Delete variant">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
          </Tip>
        )}
        <div className="flex-1" />

        {/* Inspect mode toggle */}
        {onCodeUpdate && (
          <Tip label={inspectMode ? "Exit inspect mode" : "Inspect & edit"}>
          <button
            onClick={toggleInspectMode}
            className={`rounded p-1 transition-colors ${
              inspectMode
                ? "text-indigo-400 bg-indigo-500/10"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <MousePointer2 size={12} />
          </button>
          </Tip>
        )}

        <Tip label="Copy code">
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Copy size={12} />
        </button>
        </Tip>
        {onViewComparison && comparisonCount > 0 && (
          <Tip label={`View comparison${comparisonCount > 1 ? "s" : ""}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onViewComparison(); }}
            className="relative rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <GitCompareArrows size={12} />
            {comparisonCount > 1 && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--studio-accent)] text-[7px] font-bold text-[var(--text-on-accent)]">
                {comparisonCount}
              </span>
            )}
          </button>
          </Tip>
        )}
        {onRegenerateImages && (
          <Tip label="Regenerate images">
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerateImages(); }}
            disabled={isProcessingImages}
            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
          >
            <ImagePlus size={12} />
          </button>
          </Tip>
        )}
        <Tip label="Regenerate with feedback">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowRefineInput(!showRefineInput);
            setRefineText("");
            setTimeout(() => refineInputRef.current?.focus(), 50);
          }}
          className={`rounded p-1 transition-colors ${
            showRefineInput
              ? "text-amber-400 bg-amber-500/10"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          <RotateCw size={12} />
        </button>
        </Tip>
        {onResponsive && (
          <Tip label="Responsive preview">
          <button
            onClick={(e) => { e.stopPropagation(); onResponsive(); }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Monitor size={12} />
          </button>
          </Tip>
        )}
        <Tip label="Push to Figma">
        <button
          onClick={(e) => { e.stopPropagation(); onPushToFigma(); }}
          className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Figma size={12} />
        </button>
        </Tip>
        {onPromoteToLibrary && (
          <Tip label="Add to Library">
          <button
            onClick={(e) => { e.stopPropagation(); onPromoteToLibrary(); }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <BookMarked size={12} />
          </button>
          </Tip>
        )}
      </div>

      {/* Inline refine input */}
      {showRefineInput && (
        <div
          className="flex items-center gap-1.5 border-t border-amber-500/20 bg-amber-500/5 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={refineInputRef}
            type="text"
            placeholder="What to change... (Enter to submit, empty = regenerate as-is)"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRegenerate(refineText.trim() || undefined);
                setShowRefineInput(false);
                setRefineText("");
              }
              if (e.key === "Escape") {
                setShowRefineInput(false);
                setRefineText("");
              }
            }}
            className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-amber-400/40 outline-none"
          />
          <button
            onClick={() => {
              onRegenerate(refineText.trim() || undefined);
              setShowRefineInput(false);
              setRefineText("");
            }}
            className="shrink-0 flex items-center justify-center size-5 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
          >
            <ArrowUp size={10} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Edit History */}
      {editHistory.length > 0 && (
        <EditHistoryPanel
          history={editHistory}
          onRestore={handleHistoryRestore}
          onPreview={handleHistoryPreview}
          currentPreviewId={previewEntryId}
        />
      )}
    </div>
    </TooltipProvider>
  );
}
