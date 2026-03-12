"use client";

import { useState, useCallback } from "react";
import { X, Download, Loader2, ArrowRight, Check, AlertTriangle } from "lucide-react";
import { parseFigmaUrl } from "@/lib/figma/parse-url";
import type { FigmaChange } from "@/lib/types";
import type { ImportedNodeData } from "@/lib/figma/import";

interface FigmaImportModalProps {
  onClose: () => void;
  designMd: string;
  onUpdateDesignMd: (changes: FigmaChange[]) => void;
}

type ImportStep = "input" | "loading" | "diff" | "done";

interface ImportResult {
  node: ImportedNodeData;
  changes: FigmaChange[];
}

export function FigmaImportModal({
  onClose,
  designMd,
  onUpdateDesignMd,
}: FigmaImportModalProps) {
  const [step, setStep] = useState<ImportStep>("input");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [pat, setPat] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("figma-pat") ?? "" : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [changes, setChanges] = useState<FigmaChange[]>([]);

  const handleImport = useCallback(async () => {
    setError(null);

    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      setError("Invalid Figma URL. Use a URL like figma.com/design/FILE_KEY/...");
      return;
    }
    if (!pat.trim()) {
      setError("Figma Personal Access Token is required.");
      return;
    }

    // Persist PAT for this session
    sessionStorage.setItem("figma-pat", pat);

    setStep("loading");

    try {
      const res = await fetch("/api/figma/import-node", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Figma-Token": pat,
        },
        body: JSON.stringify({
          fileKey: parsed.fileKey,
          nodeId: parsed.nodeId,
          designMd,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Import failed" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setChanges(data.changes);
      setStep("diff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("input");
    }
  }, [figmaUrl, pat, designMd]);

  const toggleChange = useCallback((index: number) => {
    setChanges((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, accepted: !c.accepted } : c
      )
    );
  }, []);

  const acceptedCount = changes.filter((c) => c.accepted).length;

  const handleApply = useCallback(() => {
    const accepted = changes.filter((c) => c.accepted);
    if (accepted.length > 0) {
      onUpdateDesignMd(accepted);
    }
    setStep("done");
  }, [changes, onUpdateDesignMd]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-xl border border-[--studio-border-strong] bg-[--bg-panel] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--studio-border] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--studio-accent-subtle]">
              <Download size={16} className="text-[--studio-accent]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[--text-primary]">
                Import from Figma
              </h2>
              <p className="text-xs text-[--text-secondary]">
                Pull design changes back into Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[--text-muted] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {step === "input" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[--text-primary]">
                  Figma Frame URL
                </label>
                <input
                  type="text"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/abc123/File-Name?node-id=1-2"
                  className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[--text-primary]">
                  Figma Personal Access Token
                </label>
                <input
                  type="password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="figd_..."
                  className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors font-mono"
                />
                <p className="text-[10px] text-[--text-muted]">
                  Stored in session only. Generate at figma.com → Settings → Personal access tokens.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={24} className="animate-spin text-[--studio-accent]" />
              <div className="text-center">
                <p className="text-sm font-medium text-[--text-primary]">
                  Importing from Figma...
                </p>
                <p className="mt-1 text-xs text-[--text-secondary]">
                  Fetching node data and generating screenshot
                </p>
              </div>
            </div>
          )}

          {step === "diff" && result && (
            <div className="space-y-4">
              {/* Screenshot */}
              {result.node.screenshotUrl && (
                <div className="overflow-hidden rounded-lg border border-[--studio-border] bg-white">
                  <img
                    src={result.node.screenshotUrl}
                    alt={result.node.name}
                    className="w-full object-contain"
                    style={{ maxHeight: 200 }}
                  />
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-[--text-primary]">
                  {result.node.name}
                </h3>
                <p className="mt-0.5 text-[11px] text-[--text-secondary]">
                  {changes.length === 0
                    ? "No differences found between Figma and your design system."
                    : `${changes.length} change${changes.length === 1 ? "" : "s"} detected. Select which to apply to DESIGN.md.`}
                </p>
              </div>

              {/* Changes list */}
              {changes.length > 0 && (
                <div className="max-h-64 space-y-1.5 overflow-y-auto">
                  {changes.map((change, i) => (
                    <ChangeRow
                      key={i}
                      change={change}
                      onToggle={() => toggleChange(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Check size={24} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[--text-primary]">
                  Import complete
                </p>
                <p className="mt-1 text-xs text-[--text-secondary]">
                  {acceptedCount > 0
                    ? `${acceptedCount} change${acceptedCount === 1 ? "" : "s"} applied to DESIGN.md.`
                    : "No changes applied."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[--studio-border] px-5 py-3">
          {step === "input" && (
            <>
              <button
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!figmaUrl.trim() || !pat.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[--studio-accent] px-4 py-1.5 text-xs font-medium text-white hover:bg-[--studio-accent-hover] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={12} />
                Import
              </button>
            </>
          )}
          {step === "diff" && (
            <>
              <button
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                <Check size={12} />
                {acceptedCount > 0
                  ? `Apply ${acceptedCount} change${acceptedCount === 1 ? "" : "s"}`
                  : "Skip changes"}
              </button>
            </>
          )}
          {step === "done" && (
            <button
              onClick={onClose}
              className="rounded-lg bg-[--studio-accent] px-4 py-1.5 text-xs font-medium text-white hover:bg-[--studio-accent-hover] transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChangeRow({
  change,
  onToggle,
}: {
  change: FigmaChange;
  onToggle: () => void;
}) {
  const typeColours: Record<string, string> = {
    colour: "bg-violet-500/15 text-violet-400",
    typography: "bg-sky-500/15 text-sky-400",
    spacing: "bg-amber-500/15 text-amber-400",
    layout: "bg-emerald-500/15 text-emerald-400",
    content: "bg-rose-500/15 text-rose-400",
  };

  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
        change.accepted
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-[--studio-border] bg-[--bg-surface] hover:bg-[--bg-hover]"
      }`}
    >
      {/* Checkbox */}
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          change.accepted
            ? "border-emerald-500 bg-emerald-500"
            : "border-[--studio-border-strong] bg-transparent"
        }`}
      >
        {change.accepted && <Check size={10} className="text-white" />}
      </div>

      {/* Type badge */}
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
          typeColours[change.type] ?? "bg-gray-500/15 text-gray-400"
        }`}
      >
        {change.type}
      </span>

      {/* Values */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[--text-primary]">
          {change.property}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {change.before && (
            <code className="text-[10px] text-red-400/80 line-through font-mono">
              {change.before}
            </code>
          )}
          {change.before && <ArrowRight size={8} className="text-[--text-muted]" />}
          <code className="text-[10px] text-emerald-400 font-mono">
            {change.after}
          </code>
        </div>
      </div>

      {/* Token match */}
      {change.designTokenMatch && (
        <code className="shrink-0 text-[10px] text-[--text-muted] font-mono">
          {change.designTokenMatch}
        </code>
      )}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

