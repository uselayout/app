"use client";

import { useState, useCallback } from "react";
import { X, Figma, Copy, Check, ExternalLink, Loader2, Smartphone, Tablet, Monitor, Info } from "lucide-react";
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

  const mcpCommand = buildMcpCommand(variant, Array.from(selectedViewports), figmaUrl || undefined);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface)]">
              <Figma size={16} className="text-[var(--text-primary)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Push to Figma
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {variant.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {step === "preview" && (
            <>
              {/* Prerequisites */}
              <div className="flex items-start gap-2.5 rounded-lg border border-[var(--studio-accent)]/30 bg-[var(--studio-accent)]/5 px-3.5 py-2.5">
                <Info size={14} className="mt-0.5 shrink-0 text-[var(--studio-accent)]" />
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  <span className="font-medium text-[var(--text-primary)]">Requires the Layout MCP server.</span>{" "}
                  Install with{" "}
                  <code className="rounded bg-[var(--bg-surface)] px-1 py-0.5 font-mono text-[10px] text-[var(--text-primary)]">
                    npx @layoutdesign/context install
                  </code>{" "}
                  and the{" "}
                  <a
                    href="https://mcp.figma.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--studio-accent)] hover:underline"
                  >
                    Figma MCP server
                  </a>.
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-secondary)]">
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
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Viewports to push
                </p>
                <div className="flex gap-1.5">
                  {VIEWPORT_OPTIONS.map(({ key, label, icon: Icon }) => {
                    const active = selectedViewports.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleViewport(key)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "bg-emerald-600 text-white"
                            : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Figma file (optional) */}
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Figma file (optional)
                </p>
                <input
                  type="text"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/... — leave blank to create new"
                  className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                />
              </div>

              {/* Command block */}
              <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    MCP Command
                  </span>
                  <button
                    onClick={() => handleCopy(mcpCommand, "command")}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
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
                <pre className="p-3 text-xs text-[var(--text-primary)] font-mono leading-relaxed overflow-x-auto max-h-40">
                  {mcpCommand}
                </pre>
              </div>

              {/* Code block */}
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  <span className="group-open:rotate-90 transition-transform">▸</span>
                  View component code ({variant.code.split("\n").length} lines)
                </summary>
                <div className="mt-2 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] overflow-hidden">
                  <div className="flex items-center justify-end border-b border-[var(--studio-border)] px-3 py-1.5">
                    <button
                      onClick={() => handleCopy(variant.code, "code")}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
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
                  <pre className="p-3 text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed overflow-x-auto max-h-48">
                    {variant.code}
                  </pre>
                </div>
              </details>
            </>
          )}

          {step === "pushing" && (
            <div className="flex flex-col items-center gap-6 py-6">
              {/* Figma coloured logo with spinner */}
              <div className="relative h-12 w-12 flex items-center justify-center">
                <svg width={26} height={39} viewBox="0 0 26 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.5 38.5C10.09 38.5 13 35.59 13 32V25.5H6.5C2.91 25.5 0 28.41 0 32C0 35.59 2.91 38.5 6.5 38.5Z" fill="#0ACF83"/>
                  <path d="M0 19.5C0 15.91 2.91 13 6.5 13H13V26H6.5C2.91 26 0 23.09 0 19.5Z" fill="#A259FF"/>
                  <path d="M0 6.5C0 2.91 2.91 0 6.5 0H13V13H6.5C2.91 13 0 10.09 0 6.5Z" fill="#F24E1E"/>
                  <path d="M13 0H19.5C23.09 0 26 2.91 26 6.5C26 10.09 23.09 13 19.5 13H13V0Z" fill="#FF7262"/>
                  <path d="M26 19.5C26 23.09 23.09 26 19.5 26C15.91 26 13 23.09 13 19.5C13 15.91 15.91 13 19.5 13C23.09 13 26 15.91 26 19.5Z" fill="#1ABCFE"/>
                </svg>
                <Loader2
                  size={14}
                  className="absolute -right-1 -bottom-0.5 animate-spin text-[var(--text-secondary)]"
                />
              </div>

              {/* Text */}
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Waiting for Figma push...
                </p>
                <p className="text-xs leading-4 text-[#8e8e95]">
                  Run the copied command in your AI agent. This modal will
                  update when the push is detected.
                </p>
              </div>

              {/* Figma URL input */}
              <div className="w-full space-y-2.5">
                <p className="text-xs text-[var(--text-primary)]">
                  Paste the Figma frame URL after pushing (optional):
                </p>
                <input
                  type="text"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/..."
                  className="w-full h-[34px] rounded-md border border-[rgba(255,255,255,0.07)] bg-[#010101] px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
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
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Pushed to Figma
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  &ldquo;{variant.name}&rdquo; is now in your Figma file.
                  Edit it there, then import changes back into Studio.
                </p>
              </div>
              {figmaUrl && (
                <a
                  href={figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <ExternalLink size={12} />
                  Open in Figma
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--studio-border)] px-5 py-3">
          {step === "preview" && (
            <>
              <button
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleCopy(mcpCommand, "command");
                  setStep("pushing");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-1.5 text-xs font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors"
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
                className="h-7 rounded-md px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleMarkDone}
                className="flex items-center gap-1.5 h-7 rounded-md bg-[#009966] px-4 text-xs font-medium text-white hover:bg-[#00aa73] transition-colors"
              >
                <Check size={12} />
                Mark as pushed
              </button>
            </>
          )}
          {step === "done" && (
            <button
              onClick={onClose}
              className="rounded-lg bg-[var(--studio-accent)] px-4 py-1.5 text-xs font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors"
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
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--studio-accent-subtle)] text-[10px] font-bold text-[var(--studio-accent)]">
        {number}
      </span>
      <div>
        <p className="text-xs font-medium text-[var(--text-primary)]">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{description}</p>
      </div>
    </div>
  );
}

const VIEWPORT_OPTIONS = [
  { key: "mobile", label: "Mobile", icon: Smartphone },
  { key: "tablet", label: "Tablet", icon: Tablet },
  { key: "desktop", label: "Desktop", icon: Monitor },
] as const;

/** Clean up a user prompt or variant name into a short Figma frame label. */
export function toFrameName(raw: string): string {
  // Strip leading verbs like "create", "build", "make", "design", "generate"
  let name = raw.replace(/^(?:create|build|make|design|generate|show|write|implement)\s+(?:me\s+)?(?:a\s+|an\s+|the\s+|all\s+(?:the\s+)?)?/i, "");
  // Title-case first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);
  // Truncate at 60 chars on a word boundary
  if (name.length > 60) {
    name = name.slice(0, 60).replace(/\s+\S*$/, "");
  }
  return name.trim() || raw.slice(0, 60);
}

function buildMcpCommand(variant: DesignVariant, viewports: string[], figmaUrl?: string): string {
  const frameName = toFrameName(variant.name);

  const inputs = [
    `- code: the TSX below`,
    `- name: "${frameName}"`,
    `- viewports: [${viewports.map((v) => `"${v}"`).join(", ")}]`,
  ];
  if (figmaUrl) {
    inputs.push(`- figmaUrl: "${figmaUrl}"`);
  }

  return `Call the layout MCP server's push_to_figma tool once with these inputs:
${inputs.join("\n")}

\`\`\`tsx
${variant.code}
\`\`\`

The tool handles all viewports in a single call. Do NOT create temp HTML files or start HTTP servers.`;
}

