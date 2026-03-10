"use client";

import { useState, useCallback } from "react";
import { X, Download, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      onClose();
    } catch {
      // Error is visible via network tab; could add toast later
    } finally {
      setIsDownloading(false);
    }
  }, [selectedFormats, project, onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
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
            <Download className="h-4 w-4 text-[--studio-accent]" />
            <h2 id="export-modal-title" className="text-sm font-semibold text-[--text-primary]">
              Export AI Kit
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[--text-muted] transition-colors hover:text-[--text-primary]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

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
      </div>
    </div>
  );
}
