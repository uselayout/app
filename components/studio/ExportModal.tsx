"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Download, FileText, Check, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { useProjectStore } from "@/lib/store/project";
import type { ExportFormat, Project } from "@/lib/types";

interface ExportModalProps {
  project: Project;
  onClose: () => void;
}

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  defaultSelected: boolean;
}

const AGENT_FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "claude-md",
    label: "CLAUDE.md",
    description: "Design system rules for Claude Code",
    defaultSelected: true,
  },
  {
    id: "agents-md",
    label: "AGENTS.md",
    description: "Context for OpenAI Codex, Jules, Factory, Amp, and compatible agents",
    defaultSelected: true,
  },
  {
    id: "cursor-rules",
    label: ".cursor/rules",
    description: "Design system and component rules for Cursor",
    defaultSelected: true,
  },
  {
    id: "design-md",
    label: "DESIGN.md",
    description: "Google's design.md format. Interoperable spec for design context.",
    defaultSelected: true,
  },
  {
    id: "codex-skill",
    label: "Codex skill",
    description: "Agent Skill folder for OpenAI Codex.",
    defaultSelected: false,
  },
];

const TOKEN_FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "tokens-css",
    label: "tokens.css",
    description: "CSS custom properties for all tokens",
    defaultSelected: true,
  },
  {
    id: "tokens-json",
    label: "tokens.json",
    description: "W3C DTCG format design tokens",
    defaultSelected: true,
  },
  {
    id: "tailwind-config",
    label: "tailwind.config.js",
    description: "Tailwind CSS theme extension",
    defaultSelected: true,
  },
];

const FORMAT_GROUPS: { heading: string; options: FormatOption[] }[] = [
  { heading: "Agent context formats", options: AGENT_FORMAT_OPTIONS },
  { heading: "Token formats", options: TOKEN_FORMAT_OPTIONS },
];

const ALL_FORMAT_OPTIONS = [...AGENT_FORMAT_OPTIONS, ...TOKEN_FORMAT_OPTIONS];

export function ExportModal({ project, onClose }: ExportModalProps) {
  const updateGoldenPath = useProjectStore((s) => s.updateGoldenPath);
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(
    new Set(ALL_FORMAT_OPTIONS.filter((f) => f.defaultSelected).map((f) => f.id))
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState("");

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
            layoutMd: project.layoutMd,
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
      const filename =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ?? `${project.name}-ai-kit.zip`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadFilename(filename);
      setDownloadComplete(true);
      // Golden path step 1: an export has happened for this project
      updateGoldenPath(project.id, { exported: true });
    } catch {
      // Error is visible via network tab; could add toast later
    } finally {
      setIsDownloading(false);
    }
  }, [selectedFormats, project, updateGoldenPath]);

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
        className="w-full max-w-md rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] shadow-[0_0_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            {downloadComplete ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <Download className="h-4 w-4 text-[var(--studio-accent)]" />
            )}
            <h2 id="export-modal-title" className="text-sm font-semibold text-[var(--text-primary)]">
              {downloadComplete ? "Bundle downloaded" : "Export AI Kit"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
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
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  <span className="mr-2 text-[var(--text-muted)]">1.</span>
                  Import the bundle into your project
                </p>
                <CopyBlock code={`npx @layoutdesign/context import ~/Downloads/${downloadFilename}`} />
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  <span className="mr-2 text-[var(--text-muted)]">2.</span>
                  Auto-configure your AI tool
                </p>
                <CopyBlock code="npx @layoutdesign/context install" />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Detects Claude Code, Cursor, and Windsurf automatically. Use{" "}
                  <code className="text-[10px]">--target claude</code> to target a specific tool.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  <span className="mr-2 text-[var(--text-muted)]">3.</span>
                  Done — your AI agent reads the design system automatically
                </p>
                <a
                  href="/docs/cli"
                  className="inline-block rounded-lg border border-[var(--studio-border)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--studio-border-strong)] hover:text-[var(--text-primary)]"
                >
                  View full CLI docs
                </a>
              </div>

              {/* Next: gate your edits with Layout Live */}
              <div className="space-y-2 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-3">
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  Next: gate your edits
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Layout Live checks every visual edit against this design system before it lands in your code.
                </p>
                <CopyBlock code="npx @layoutdesign/context setup-live" />
                <a
                  href="/live"
                  className="inline-block text-[10px] text-[var(--text-secondary)] underline transition-colors hover:text-[var(--text-primary)]"
                >
                  Download Layout Live
                </a>
              </div>

              {/* Optional: Layout UI components */}
              <div className="space-y-2 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-3">
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  Need pre-built components?
                </p>
                <CopyBlock code="npx @layoutdesign/context add button" />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Install on-brand primitives from{" "}
                  <a
                    href="https://ui.staging.layout.design"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[var(--text-secondary)]"
                  >
                    Layout UI
                  </a>{" "}
                  instead of hand-rolling them.
                </p>
              </div>
            </div>

            {/* Done action */}
            <div className="border-t border-[var(--studio-border)] px-5 py-4">
              <Button
                onClick={onClose}
                className="h-10 w-full bg-[var(--studio-accent)] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)]"
              >
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Format list */}
            <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
              {FORMAT_GROUPS.map((group) => (
                <div key={group.heading} className="space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    {group.heading}
                  </p>
                  {group.options.map((format) => {
                    const selected = selectedFormats.has(format.id);
                    return (
                      <button
                        key={format.id}
                        onClick={() => toggleFormat(format.id)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors ${
                          selected
                            ? "border-[var(--studio-accent)] bg-[var(--studio-accent-subtle)]"
                            : "border-[var(--studio-border)] bg-[var(--bg-surface)] hover:border-[var(--studio-border-strong)]"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            selected
                              ? "border-[var(--studio-accent)] bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                              : "border-[var(--studio-border)]"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </div>
                        <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-[var(--text-primary)]">
                            {format.label}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {format.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* layout.md always included note */}
            <div className="border-t border-[var(--studio-border)] px-5 py-3">
              <p className="text-[10px] text-[var(--text-muted)]">
                layout.md is always included in the bundle. Other formats are only added when selected.
              </p>
            </div>

            {/* Actions */}
            <div className="border-t border-[var(--studio-border)] px-5 py-4">
              <Button
                onClick={handleDownload}
                disabled={isDownloading || selectedFormats.size === 0}
                className="h-10 w-full bg-[var(--studio-accent)] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-40"
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
