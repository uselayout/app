"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Sparkles, AlertTriangle } from "lucide-react";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { parseVariants } from "@/lib/explore/parse-variants";
import { extractComponentName, buildSrcdoc } from "@/lib/explore/preview-helpers";
import type { DesignVariant } from "@/lib/types";

interface ComparisonViewProps {
  prompt: string;
  designMd: string;
  onClose: () => void;
}

export function ComparisonView({ prompt, designMd, onClose }: ComparisonViewProps) {
  const [withDs, setWithDs] = useState<DesignVariant | null>(null);
  const [withoutDs, setWithoutDs] = useState<DesignVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    async function generate() {
      const apiKey = getStoredApiKey();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) headers["X-Api-Key"] = apiKey;

      try {
        // Run both in parallel
        const [withRes, withoutRes] = await Promise.all([
          fetch("/api/generate/explore", {
            method: "POST",
            headers,
            body: JSON.stringify({
              prompt,
              designMd,
              variantCount: 1,
            }),
            signal,
          }),
          fetch("/api/generate/explore", {
            method: "POST",
            headers,
            body: JSON.stringify({
              prompt,
              designMd: "No design system provided. Use your best judgement for colours, spacing, and typography. Make it look modern and professional.",
              variantCount: 1,
            }),
            signal,
          }),
        ]);

        if (!withRes.ok || !withoutRes.ok) {
          throw new Error("Generation failed");
        }

        // Read both streams
        const [withText, withoutText] = await Promise.all([
          readStream(withRes, signal),
          readStream(withoutRes, signal),
        ]);

        const withVariants = parseVariants(withText);
        const withoutVariants = parseVariants(withoutText);

        setWithDs(withVariants[0] ?? null);
        setWithoutDs(withoutVariants[0] ?? null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Comparison failed");
      } finally {
        setLoading(false);
      }
    }

    generate();
    return () => { abortRef.current?.abort(); };
  }, [prompt, designMd]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--studio-border] bg-[--bg-panel] px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[--text-primary]">
            Before / After Comparison
          </h2>
          <p className="text-xs text-[--text-secondary]">
            Same prompt — with and without your design system
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-[--text-muted] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[--studio-border-strong] border-t-[--studio-accent]" />
            <p className="text-sm text-[--text-secondary]">
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
            <div className="flex flex-1 flex-col border-r border-[--studio-border]">
              <div className="flex items-center gap-2 border-b border-[--studio-border] bg-red-500/5 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-xs font-semibold text-red-400">
                  Without Design System
                </span>
              </div>
              <div className="flex-1 bg-white">
                {withoutDs ? (
                  <PreviewFrame code={withoutDs.code} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-[--text-muted]">No result</p>
                  </div>
                )}
              </div>
            </div>

            {/* With design system */}
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-[--studio-border] bg-emerald-500/5 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  With Design System
                </span>
                <Sparkles size={12} className="text-emerald-400" />
              </div>
              <div className="flex-1 bg-white">
                {withDs ? (
                  <PreviewFrame code={withDs.code} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-[--text-muted]">No result</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer with prompt */}
      <div className="border-t border-[--studio-border] bg-[--bg-panel] px-5 py-3">
        <p className="text-xs text-[--text-muted]">
          Prompt: &ldquo;{prompt}&rdquo;
        </p>
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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[--studio-border-strong] border-t-[--studio-accent]" />
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

