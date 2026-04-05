"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check, Info, ExternalLink } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import type { DesignVariant } from "@/lib/types";

interface PaperPushModalProps {
  variant: DesignVariant;
  onClose: () => void;
}

type PushStep = "preview" | "pushing" | "done";

export function PaperPushModal({ variant, onClose }: PaperPushModalProps) {
  const [step, setStep] = useState<PushStep>("preview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const mcpCommand = buildPaperMcpCommand(variant);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface)]">
              <PaperIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Push to Paper
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
                  <span className="font-medium text-[var(--text-primary)]">Requires the Paper MCP server.</span>{" "}
                  Connect it in your AI coding agent. See{" "}
                  <a
                    href="https://paper.design/docs/mcp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--studio-accent)] hover:underline"
                  >
                    Paper MCP docs
                  </a>.
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  Copy the command below and run it in your AI coding agent
                  to push this component directly to Paper&apos;s canvas as HTML.
                </p>
                <div className="space-y-2.5">
                  <StepItem
                    number={1}
                    label="Copy the push command"
                    description="Includes the HTML/CSS to write to Paper's canvas"
                  />
                  <StepItem
                    number={2}
                    label="Run in your AI agent"
                    description="Paste into Claude Code, Cursor, or any MCP-compatible agent"
                  />
                  <StepItem
                    number={3}
                    label="Component appears on canvas"
                    description="The HTML is written directly to a new Paper artboard"
                  />
                </div>
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
                  <span className="group-open:rotate-90 transition-transform">&#9656;</span>
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
              <div className="relative h-12 w-12 flex items-center justify-center">
                <PaperIcon size={32} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Waiting for Paper push...
                </p>
                <p className="text-xs leading-4 text-[var(--text-muted)]">
                  Run the copied command in your AI agent. Click
                  &ldquo;Mark as pushed&rdquo; when done.
                </p>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Check size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Pushed to Paper
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    &ldquo;{variant.name}&rdquo; is now on your Paper canvas.
                  </p>
                </div>
              </div>
              <a
                href="https://paper.design"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <ExternalLink size={12} />
                Open Paper
              </a>
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
                onClick={() => setStep("done")}
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

/** Paper.design logo icon — adapted from official brand SVG */
export function PaperIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M82.48 52.5H247.5V130.7c0 13.5-.32 28.4.04 41.8-24.93-.18-50.13.28-75 -.06V247.5c-12.97-.23-26.5-.04-39.52-.04H52.54V82.52c9.98-.1 20.1-.02 30.1-.01-.3-9.9.06-20.1-.08-30Z"
        fill="currentColor"
        opacity={0.9}
      />
      <path
        d="M52.47 82.52c9.98-.1 20.1-.02 30.1-.01-.04 6.69-.28 88.86.21 89.83l.21.15 60.5-.03c9.32 0 19.85.25 29.02-.02V247.5c-12.97-.23-26.5-.04-39.52-.04H52.54V82.52Z"
        fill="currentColor"
        opacity={0.65}
      />
      <path
        d="M83.25 82.53l89.22-.03-.02 59.3c0 9.35-.35 21.47.06 30.65-9.17.26-19.7.02-29.02.02L82.99 172.5l-.21-.15c-.49-.97-.26-83.15-.2-89.82l.67.02Z"
        fill="currentColor"
        opacity={0.35}
      />
    </svg>
  );
}

/** Clean up variant name for Paper artboard label */
function toArtboardName(raw: string): string {
  let name = raw.replace(
    /^(?:create|build|make|design|generate|show|write|implement)\s+(?:me\s+)?(?:a\s+|an\s+|the\s+|all\s+(?:the\s+)?)?/i,
    ""
  );
  name = name.charAt(0).toUpperCase() + name.slice(1);
  if (name.length > 60) {
    name = name.slice(0, 60).replace(/\s+\S*$/, "");
  }
  return name.trim() || raw.slice(0, 60);
}

function buildPaperMcpCommand(variant: DesignVariant): string {
  const artboardName = toArtboardName(variant.name);

  return `Use the Paper MCP server to push this component to the canvas:

1. Call create_artboard to create a new artboard named "${artboardName}"
2. Call write_html on the new artboard with the HTML below

\`\`\`tsx
${variant.code}
\`\`\`

The code is a React/Tailwind component. Paper's write_html accepts HTML, so render the JSX as static HTML with inline Tailwind classes.`;
}
