"use client";

import { useState, useCallback } from "react";
import { X, Figma, Copy, Check, ExternalLink, Loader2, Smartphone, Tablet, Monitor } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { parseFigmaUrl } from "@/lib/figma/parse-url";
import type { DesignVariant } from "@/lib/types";

interface FigmaPushModalProps {
  variant: DesignVariant;
  onClose: () => void;
  onPushComplete?: (record: { fileKey: string; nodeId: string; viewports: string[] }) => void;
}

type PushStep = "preview" | "pushing" | "done";

export function FigmaPushModal({
  variant,
  onClose,
  onPushComplete,
}: FigmaPushModalProps) {
  const [step, setStep] = useState<PushStep>("preview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [selectedViewports, setSelectedViewports] = useState<Set<string>>(
    () => new Set(["mobile", "tablet", "desktop"])
  );

  const toggleViewport = useCallback((vp: string) => {
    setSelectedViewports((prev) => {
      const next = new Set(prev);
      if (next.has(vp)) {
        if (next.size > 1) next.delete(vp);
      } else {
        next.add(vp);
      }
      return next;
    });
  }, []);

  const mcpCommand = buildMcpCommand(variant, Array.from(selectedViewports));

  const handleCopy = useCallback(
    async (text: string, field: string) => {
      await copyToClipboard(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    },
    []
  );

  const handleMarkDone = useCallback(() => {
    setStep("done");

    // Try to parse Figma URL for the push record
    const parsed = parseFigmaUrl(figmaUrl);
    if (parsed && onPushComplete) {
      onPushComplete({ ...parsed, viewports: Array.from(selectedViewports) });
    }
  }, [figmaUrl, selectedViewports, onPushComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-[--studio-border-strong] bg-[--bg-panel] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--studio-border] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--studio-accent-subtle]">
              <Figma size={16} className="text-[--studio-accent]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[--text-primary]">
                Push to Figma
              </h2>
              <p className="text-xs text-[--text-secondary]">
                {variant.name}
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
        <div className="px-5 py-4 space-y-4">
          {step === "preview" && (
            <>
              {/* Instructions */}
              <div className="space-y-3">
                <p className="text-xs text-[--text-secondary]">
                  Copy the command below and run it in your AI coding agent
                  (Claude Code, Cursor, etc.) to push this component to Figma.
                </p>

                {/* Step indicators */}
                <div className="space-y-2.5">
                  <StepItem
                    number={1}
                    label="Copy the push command"
                    description="This tells the MCP server to render and push your component"
                  />
                  <StepItem
                    number={2}
                    label="Run in your AI agent"
                    description="Paste into Claude Code, Cursor, or any MCP-compatible agent"
                  />
                  <StepItem
                    number={3}
                    label="Component appears in Figma"
                    description="The rendered component is pushed as a new frame"
                  />
                </div>
              </div>

              {/* Viewport selection */}
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
                  Viewports to push
                </p>
                <div className="flex gap-1.5">
                  {VIEWPORT_OPTIONS.map(({ key, label, icon: Icon }) => {
                    const active = selectedViewports.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleViewport(key)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "bg-[--studio-accent] text-white"
                            : "bg-[--bg-surface] text-[--text-muted] hover:text-[--text-secondary] hover:bg-[--bg-hover]"
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Command block */}
              <div className="rounded-lg border border-[--studio-border] bg-[--bg-surface] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[--studio-border] px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
                    MCP Command
                  </span>
                  <button
                    onClick={() => handleCopy(mcpCommand, "command")}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
                  >
                    {copiedField === "command" ? (
                      <>
                        <Check size={10} className="text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-xs text-[--text-primary] font-mono leading-relaxed overflow-x-auto max-h-40">
                  {mcpCommand}
                </pre>
              </div>

              {/* Code block */}
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-1.5 text-xs text-[--text-muted] hover:text-[--text-secondary] transition-colors">
                  <span className="group-open:rotate-90 transition-transform">▸</span>
                  View component code ({variant.code.split("\n").length} lines)
                </summary>
                <div className="mt-2 rounded-lg border border-[--studio-border] bg-[--bg-surface] overflow-hidden">
                  <div className="flex items-center justify-end border-b border-[--studio-border] px-3 py-1.5">
                    <button
                      onClick={() => handleCopy(variant.code, "code")}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
                    >
                      {copiedField === "code" ? (
                        <>
                          <Check size={10} className="text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={10} />
                          Copy code
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] text-[--text-secondary] font-mono leading-relaxed overflow-x-auto max-h-48">
                    {variant.code}
                  </pre>
                </div>
              </details>
            </>
          )}

          {step === "pushing" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-[--studio-accent-subtle] flex items-center justify-center">
                  <Figma size={24} className="text-[--studio-accent]" />
                </div>
                <Loader2
                  size={14}
                  className="absolute -right-1 -bottom-1 animate-spin text-[--studio-accent]"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[--text-primary]">
                  Waiting for Figma push...
                </p>
                <p className="mt-1 text-xs text-[--text-secondary]">
                  Run the copied command in your AI agent. This modal will
                  update when the push is detected.
                </p>
              </div>

              {/* Optional: paste Figma URL to confirm */}
              <div className="w-full space-y-2">
                <label className="text-xs text-[--text-muted]">
                  Paste the Figma frame URL after pushing (optional):
                </label>
                <input
                  type="text"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/..."
                  className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
                />
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Check size={24} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[--text-primary]">
                  Pushed to Figma
                </p>
                <p className="mt-1 text-xs text-[--text-secondary]">
                  &ldquo;{variant.name}&rdquo; is now in your Figma file.
                  Edit it there, then import changes back into Studio.
                </p>
              </div>
              {figmaUrl && (
                <a
                  href={figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs font-medium text-[--text-primary] hover:bg-[--bg-hover] transition-colors"
                >
                  <ExternalLink size={12} />
                  Open in Figma
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[--studio-border] px-5 py-3">
          {step === "preview" && (
            <>
              <button
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleCopy(mcpCommand, "command");
                  setStep("pushing");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[--studio-accent] px-4 py-1.5 text-xs font-medium text-white hover:bg-[--studio-accent-hover] transition-colors"
              >
                <Copy size={12} />
                Copy &amp; Continue
              </button>
            </>
          )}
          {step === "pushing" && (
            <>
              <button
                onClick={() => setStep("preview")}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleMarkDone}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                <Check size={12} />
                Mark as pushed
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepItem({
  number,
  label,
  description,
}: {
  number: number;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[--studio-accent-subtle] text-[10px] font-bold text-[--studio-accent]">
        {number}
      </span>
      <div>
        <p className="text-xs font-medium text-[--text-primary]">{label}</p>
        <p className="text-[11px] text-[--text-muted]">{description}</p>
      </div>
    </div>
  );
}

const VIEWPORT_OPTIONS = [
  { key: "mobile", label: "Mobile", icon: Smartphone },
  { key: "tablet", label: "Tablet", icon: Tablet },
  { key: "desktop", label: "Desktop", icon: Monitor },
] as const;

function buildMcpCommand(variant: DesignVariant, viewports: string[]): string {
  const vpList = viewports.join(", ");
  const multiVp = viewports.length > 1;

  return `Call the layout MCP server's push_to_figma tool with the following inputs:
- code: the TSX below
- name: "${variant.name}"

Push for viewport(s): ${vpList}.${multiVp ? `\nCall push_to_figma once per viewport with the name suffixed — e.g. "${variant.name} — Mobile", "${variant.name} — Desktop".` : ""}

\`\`\`tsx
${variant.code}
\`\`\`

Do NOT create temp HTML files or start HTTP servers. The push_to_figma tool handles everything.`;
}

