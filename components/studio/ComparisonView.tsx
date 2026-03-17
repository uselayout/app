"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Sparkles, AlertTriangle, Maximize2, Minimize2, Loader2, Copy } from "lucide-react";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { parseVariants } from "@/lib/explore/parse-variants";
import { extractComponentName, buildSrcdoc } from "@/lib/explore/preview-helpers";
import { processCodeImages } from "@/lib/image/process-code-images";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import type { DesignVariant, ContextFile, ComparisonResult } from "@/lib/types";

interface ComparisonViewProps {
  prompt: string;
  designMd: string;
  baseCode?: string;
  imageDataUrl?: string;
  contextFiles?: ContextFile[];
  savedResult?: ComparisonResult;
  onSave?: (result: ComparisonResult) => void;
  onClose: () => void;
}

export function ComparisonView({
  prompt,
  designMd,
  baseCode,
  imageDataUrl,
  contextFiles,
  savedResult,
  onSave,
  onClose,
}: ComparisonViewProps) {
  const [withDs, setWithDs] = useState<DesignVariant | null>(savedResult?.withDs ?? null);
  const [withoutDs, setWithoutDs] = useState<DesignVariant | null>(savedResult?.withoutDs ?? null);
  const [loading, setLoading] = useState(!savedResult);
  const [processingImages, setProcessingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedPanel, setFocusedPanel] = useState<"left" | "right" | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const savedRef = useRef(false);

  // Handle Escape to restore split view or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (focusedPanel) {
          setFocusedPanel(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedPanel, onClose]);

  // Generate comparison (skip if savedResult provided)
  useEffect(() => {
    if (savedResult) return;

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    async function generate() {
      const apiKey = getStoredApiKey();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) headers["X-Api-Key"] = apiKey;

      const sharedBody = {
        prompt,
        variantCount: 1,
        imageDataUrl,
        contextFiles,
      };

      try {
        const [withRes, withoutRes] = await Promise.all([
          // With design system — refine from existing variant if available
          fetch("/api/generate/explore", {
            method: "POST",
            headers,
            body: JSON.stringify({
              ...sharedBody,
              ...(baseCode ? { baseCode } : {}),
              designMd,
            }),
            signal,
          }),
          // Without design system — fresh generation, NO baseCode
          fetch("/api/generate/explore", {
            method: "POST",
            headers,
            body: JSON.stringify({
              ...sharedBody,
              designMd: "No design system provided. Use your best judgement for colours, spacing, and typography. Make it look modern and professional.",
            }),
            signal,
          }),
        ]);

        if (!withRes.ok || !withoutRes.ok) {
          throw new Error("Generation failed");
        }

        const [withText, withoutText] = await Promise.all([
          readStream(withRes, signal),
          readStream(withoutRes, signal),
        ]);

        const withVariants = parseVariants(withText);
        const withoutVariants = parseVariants(withoutText);

        const withVariant = withVariants[0] ?? null;
        const withoutVariant = withoutVariants[0] ?? null;

        setWithDs(withVariant);
        setWithoutDs(withoutVariant);
        setLoading(false);

        // Process images in parallel for both panels
        if (withVariant || withoutVariant) {
          setProcessingImages(true);
          try {
            const [withProcessed, withoutProcessed] = await Promise.all([
              withVariant ? processCodeImages(withVariant.code) : Promise.resolve(null),
              withoutVariant ? processCodeImages(withoutVariant.code) : Promise.resolve(null),
            ]);

            const finalWith = withProcessed && withProcessed.code !== withVariant?.code
              ? { ...withVariant!, code: withProcessed.code }
              : withVariant;
            const finalWithout = withoutProcessed && withoutProcessed.code !== withoutVariant?.code
              ? { ...withoutVariant!, code: withoutProcessed.code }
              : withoutVariant;

            if (finalWith !== withVariant) setWithDs(finalWith);
            if (finalWithout !== withoutVariant) setWithoutDs(finalWithout);

            // Auto-save
            if (onSave && finalWith && finalWithout && !savedRef.current) {
              savedRef.current = true;
              onSave({
                id: crypto.randomUUID(),
                prompt,
                withDs: finalWith,
                withoutDs: finalWithout,
                createdAt: new Date().toISOString(),
              });
            }
          } finally {
            setProcessingImages(false);
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Comparison failed");
        setLoading(false);
      }
    }

    generate();
    return () => { abortRef.current?.abort(); };
  }, [prompt, designMd, baseCode, imageDataUrl, contextFiles, savedResult, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--studio-border)] bg-[var(--bg-panel)] px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {savedResult ? "Saved Comparison" : "Before / After Comparison"}
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Same prompt — with and without your design system
          </p>
        </div>
        <div className="flex items-center gap-2">
          {processingImages && (
            <div className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Generating images…</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              Generating comparison...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Without design system */}
            {focusedPanel !== "right" && (
              <div className={`flex flex-1 flex-col ${focusedPanel !== "left" ? "border-r border-[var(--studio-border)]" : ""}`}>
                <div className="flex items-center gap-2 border-b border-[var(--studio-border)] bg-red-500/5 px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-red-400">
                    Without Design System
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => setFocusedPanel(focusedPanel === "left" ? null : "left")}
                    className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    title={focusedPanel === "left" ? "Split view" : "Full screen"}
                  >
                    {focusedPanel === "left" ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  </button>
                </div>
                <div className="flex-1 bg-white">
                  {withoutDs ? (
                    <PreviewFrame code={withoutDs.code} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-xs text-[var(--text-muted)]">No result</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* With design system */}
            {focusedPanel !== "left" && (
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-[var(--studio-border)] bg-emerald-500/5 px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">
                    With Design System
                  </span>
                  <Sparkles size={12} className="text-emerald-400" />
                  <div className="flex-1" />
                  <button
                    onClick={() => setFocusedPanel(focusedPanel === "right" ? null : "right")}
                    className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    title={focusedPanel === "right" ? "Split view" : "Full screen"}
                  >
                    {focusedPanel === "right" ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  </button>
                </div>
                <div className="flex-1 bg-white">
                  {withDs ? (
                    <PreviewFrame code={withDs.code} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-xs text-[var(--text-muted)]">No result</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with prompt */}
      <div className="flex items-center gap-2 border-t border-[var(--studio-border)] bg-[var(--bg-panel)] px-5 py-3">
        <p className="flex-1 text-xs text-[var(--text-muted)] truncate">
          Prompt: &ldquo;{prompt}&rdquo;
        </p>
        <button
          onClick={() => copyToClipboard(prompt)}
          className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title="Copy prompt"
        >
          <Copy size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PreviewFrame({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!code) return;
    setReady(false);

    let cancelled = false;

    async function render() {
      try {
        const res = await fetch("/api/transpile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) return;
        const { js } = await res.json();
        if (cancelled) return;

        const name = extractComponentName(code);
        if (iframeRef.current) {
          iframeRef.current.srcdoc = buildSrcdoc(js, name);
          setReady(true);
        }
      } catch {
        // Silently fail — preview just won't render
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="relative h-full w-full">
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className={`h-full w-full border-0 transition-opacity ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        title="Preview"
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
        </div>
      )}
    </div>
  );
}

async function readStream(res: Response, signal: AbortSignal): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }

  return text;
}
