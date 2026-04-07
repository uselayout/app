"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Search } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

function CopyCommand({ command, label }: { command: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(command);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-1">
      {label && (
        <p className="text-[10px] font-medium text-[var(--text-secondary)]">{label}</p>
      )}
      <button
        onClick={handleCopy}
        className="group flex w-full items-center gap-2 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-left transition-colors hover:border-[var(--studio-border-strong)]"
      >
        <code className="flex-1 text-xs font-mono text-[var(--text-primary)] truncate">
          {command}
        </code>
        {copied ? (
          <Check className="h-3 w-3 shrink-0 text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]" />
        )}
      </button>
    </div>
  );
}

interface ConnectTabProps {
  hasLayoutMd?: boolean;
  projectName?: string;
}

export function ConnectTab({ hasLayoutMd, projectName }: ConnectTabProps) {
  const [scanDir, setScanDir] = useState("");
  const [scanType, setScanType] = useState<"storybook" | "codebase" | "both">("both");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ storybook?: { components: Array<{ componentName?: string; name?: string; filePath: string }> }; codebase?: { components: Array<{ name: string; filePath: string; props: string[] }> } } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleScan() {
    if (!scanDir.trim()) return;
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    try {
      const res = await fetch("/api/integrations/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectDir: scanDir.trim(), type: scanType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Scan failed");
      }
      const data = await res.json();
      setScanResult(data.result);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  if (hasLayoutMd) {
    return (
      <div className="space-y-5 p-3">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[var(--text-primary)]">
            Your design system is ready
          </h3>
          <p className="text-[10px] leading-[16px] text-[var(--text-muted)]">
            {projectName ? `${projectName} has` : "Your"} layout.md is ready. Export the bundle, then use the CLI to connect it to your AI agent.
          </p>
        </div>

        <div className="space-y-3">
          <CopyCommand
            label="1. Export and import the bundle"
            command={`npx @layoutdesign/context import ~/Downloads/${projectName ? projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "your-project"}-ai-kit.zip`}
          />
          <p className="text-[10px] text-[var(--text-muted)]">
            Click <span className="text-[var(--text-secondary)]">Export</span> above to download, then run this to import into your project.
          </p>
        </div>

        <div className="space-y-3">
          <CopyCommand
            label="2. Install the MCP server"
            command="npx @layoutdesign/context install"
          />
          <p className="text-[10px] text-[var(--text-muted)]">
            Auto-detects Claude Code, Cursor, Antigravity, and Windsurf. Use{" "}
            <code className="text-[10px] text-[var(--text-secondary)]">--target claude</code>{" "}
            to target a specific tool.
          </p>
        </div>

        <div className="space-y-2 border-t border-[var(--studio-border)] pt-4">
          <p className="text-[10px] leading-[16px] text-[var(--text-muted)]">
            Done. Your AI agent now reads the design system automatically on every session.
          </p>
        </div>

        <div className="space-y-3 border-t border-[var(--studio-border)] pt-4">
          <h3 className="text-xs font-semibold text-[var(--text-primary)]">
            Scan existing components
          </h3>
          <p className="text-[10px] leading-[16px] text-[var(--text-muted)]">
            Scan a project directory to find existing React components and Storybook stories. Matches them against your design system.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="/path/to/your/project"
              value={scanDir}
              onChange={(e) => setScanDir(e.target.value)}
              className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
            />
            <div className="flex items-center gap-2">
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value as "storybook" | "codebase" | "both")}
                className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] text-[var(--text-primary)] outline-none"
              >
                <option value="both">Both</option>
                <option value="storybook">Storybook only</option>
                <option value="codebase">Codebase only</option>
              </select>
              <button
                onClick={handleScan}
                disabled={scanning || !scanDir.trim()}
                className="flex items-center gap-1.5 rounded-md bg-[var(--studio-accent)] px-3 py-1 text-[10px] font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
              >
                {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                Scan
              </button>
            </div>
          </div>
          {scanError && (
            <p className="text-[10px] text-red-400">{scanError}</p>
          )}
          {scanResult && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scanResult.codebase && scanResult.codebase.components.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">
                    Codebase ({scanResult.codebase.components.length} components)
                  </p>
                  {scanResult.codebase.components.slice(0, 20).map((c) => (
                    <div key={c.filePath} className="flex items-center gap-2 py-0.5">
                      <span className="text-[10px] font-medium text-[var(--text-primary)]">{c.name}</span>
                      <span className="text-[9px] text-[var(--text-muted)] truncate">{c.filePath}</span>
                    </div>
                  ))}
                </div>
              )}
              {scanResult.storybook && scanResult.storybook.components.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">
                    Storybook ({scanResult.storybook.components.length} stories)
                  </p>
                  {scanResult.storybook.components.slice(0, 20).map((c) => (
                    <div key={c.filePath} className="flex items-center gap-2 py-0.5">
                      <span className="text-[10px] font-medium text-[var(--text-primary)]">{c.componentName || c.name}</span>
                      <span className="text-[9px] text-[var(--text-muted)] truncate">{c.filePath}</span>
                    </div>
                  ))}
                </div>
              )}
              {(!scanResult.codebase?.components.length && !scanResult.storybook?.components.length) && (
                <p className="text-[10px] text-[var(--text-muted)]">No components found in this directory.</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--studio-border)] pt-4">
          <a
            href="/docs/cli"
            className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Full CLI documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-3">
      {/* Main install */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[var(--text-primary)]">
          Connect to your AI agent
        </h3>
        <p className="text-[10px] leading-[16px] text-[var(--text-muted)]">
          The Layout CLI configures the MCP server so your AI agent reads
          your design system automatically on every session.
        </p>
      </div>

      <div className="space-y-3">
        <CopyCommand
          label="1. Install and configure"
          command="npx @layoutdesign/context install"
        />
        <p className="text-[10px] text-[var(--text-muted)]">
          Auto-detects Claude Code, Cursor, Antigravity, and Windsurf. Use{" "}
          <code className="text-[10px] text-[var(--text-secondary)]">--target claude</code>{" "}
          to target a specific tool.
        </p>
      </div>

      {/* Starter kits */}
      <div className="space-y-2 border-t border-[var(--studio-border)] pt-4">
        <h3 className="text-xs font-semibold text-[var(--text-primary)]">
          Or start with a free kit
        </h3>
        <p className="text-[10px] leading-[16px] text-[var(--text-muted)]">
          Try the CLI without extracting first. Three design systems bundled free:
        </p>
        <CopyCommand command="npx @layoutdesign/context init --kit linear-lite" />
        <div className="flex flex-wrap gap-1.5">
          {["linear-lite", "stripe-lite", "notion-lite"].map((kit) => (
            <span
              key={kit}
              className="rounded border border-[var(--studio-border)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]"
            >
              {kit}
            </span>
          ))}
        </div>
      </div>

      {/* Docs link */}
      <div className="border-t border-[var(--studio-border)] pt-4">
        <a
          href="/docs/cli"
          className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          Full CLI documentation
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
