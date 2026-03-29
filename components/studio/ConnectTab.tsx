"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
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
            command="npx @layoutdesign/context import ~/Downloads/*-ai-kit.zip"
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
