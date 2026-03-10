"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Download, FileText, Check, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyBlock } from "@/components/shared/CopyBlock";
import type { ExportFormat, Project } from "@/lib/types";

interface ExportModalProps {
  project: Project;
  onClose: () => void;
}

const FORMAT_OPTIONS: { id: ExportFormat; label: string; description: string }[] = [
  {
    id: "claude-md",
    label: "CLAUDE.md",
    description: "Design system rules for Claude Code",
  },
  {
    id: "cursor-rules",
    label: ".cursor/rules",
    description: "Design system and component rules for Cursor",
  },
  {
    id: "agents-md",
    label: "AGENTS.md",
    description: "Context for OpenAI Codex, Jules, Factory, Amp, and compatible agents",
  },
  {
    id: "tokens-css",
    label: "tokens.css",
    description: "CSS custom properties for all tokens",
  },
  {
    id: "tokens-json",
    label: "tokens.json",
    description: "W3C DTCG format design tokens",
  },
  {
    id: "tailwind-config",
    label: "tailwind.config.js",
    description: "Tailwind CSS theme extension",
  },
];

export function ExportModal({ project, onClose }: ExportModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(
    new Set(FORMAT_OPTIONS.map((f) => f.id))
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggleFormat = useCallback((format: ExportFormat) => {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(format)) {
        next.delete(format);
      } else {
        next.add(format);
      }
      return next;
    });
  }, []);

  const handleDownload = useCallback(async () => {
    if (selectedFormats.size === 0) return;
    setIsDownloading(true);

    try {
      const res = await fetch("/api/export/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: {
            id: project.id,
            name: project.name,
            sourceType: project.sourceType,
            sourceUrl: project.sourceUrl,
            designMd: project.designMd,
            extractionData: project.extractionData,
          },
          formats: Array.from(selectedFormats),
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ?? `${project.name}-ai-kit.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadComplete(true);
    } catch {
      // Error is visible via network tab; could add toast later
    } finally {
      setIsDownloading(false);
    }
  }, [selectedFormats, project]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="w-full max-w-md rounded-xl border border-[--studio-border] bg-[--bg-panel] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--studio-border] px-5 py-4">
          <div className="flex items-center gap-2">
            {downloadComplete ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <Download className="h-4 w-4 text-[--studio-accent]" />
            )}
            <h2 id="export-modal-title" className="text-sm font-semibold text-[--text-primary]">
              {downloadComplete ? "Bundle downloaded" : "Export AI Kit"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[--text-muted] transition-colors hover:text-[--text-primary]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {downloadComplete ? (
          <>
            {/* Next Steps */}
            <div className="p-5 space-y-5">
              {/* Step 1 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[--text-primary]">
                  <span className="mr-2 text-[--text-muted]">1.</span>
                  Import the bundle into your project
                </p>
                <CopyBlock code="npx @superduperui/context import ./your-export.zip" />
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[--text-primary]">
                  <span className="mr-2 text-[--text-muted]">2.</span>
                  Auto-configure your AI tool
                </p>
                <CopyBlock code="npx @superduperui/context install" />
                <p className="text-[10px] text-[--text-muted]">
                  Detects Claude Code, Cursor, and Windsurf automatically. Use{" "}
                  <code className="text-[10px]">--target claude</code> to target a specific tool.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[--text-primary]">
                  <span className="mr-2 text-[--text-muted]">3.</span>
                  Done — your AI agent reads the design system automatically
                </p>
                <a
                  href="/docs/cli"
                  className="inline-block rounded-lg border border-[--studio-border] px-3 py-2 text-xs text-[--text-secondary] transition-colors hover:border-[--studio-border-strong] hover:text-[--text-primary]"
                >
                  View full CLI docs
                </a>
              </div>
            </div>

            {/* Done action */}
            <div className="border-t border-[--studio-border] px-5 py-4">
              <Button
                onClick={onClose}
                className="h-10 w-full bg-[--studio-accent] text-[--text-on-accent] hover:bg-[--studio-accent-hover]"
              >
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Format list */}
            <div className="p-5 space-y-2">
              <p className="mb-3 text-xs text-[--text-secondary]">
                Select formats to include in your bundle:
              </p>
              {FORMAT_OPTIONS.map((format) => {
                const selected = selectedFormats.has(format.id);
                return (
                  <button
                    key={format.id}
                    onClick={() => toggleFormat(format.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-[--studio-accent] bg-[--studio-accent-subtle]"
                        : "border-[--studio-border] bg-[--bg-surface] hover:border-[--studio-border-strong]"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-[--studio-accent] bg-[--studio-accent] text-white"
                          : "border-[--studio-border]"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <FileText className="h-4 w-4 shrink-0 text-[--text-muted]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-[--text-primary]">
                        {format.label}
                      </div>
                      <div className="text-[10px] text-[--text-muted]">
                        {format.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* DESIGN.md always included note */}
            <div className="border-t border-[--studio-border] px-5 py-3">
              <p className="text-[10px] text-[--text-muted]">
                DESIGN.md is always included in the bundle.
              </p>
            </div>

            {/* Actions */}
            <div className="border-t border-[--studio-border] px-5 py-4">
              <Button
                onClick={handleDownload}
                disabled={isDownloading || selectedFormats.size === 0}
                className="h-10 w-full bg-[--studio-accent] text-[--text-on-accent] hover:bg-[--studio-accent-hover] disabled:opacity-40"
              >
                {isDownloading ? "Generating..." : "Download Bundle"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
