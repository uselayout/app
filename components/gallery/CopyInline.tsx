"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

// Inline code block with a copy button sitting on the right. Used for the
// "npx @layoutdesign/context install <slug>" snippet on the gallery detail.
export function CopyInline({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface-muted)] pl-3 pr-1 py-1">
      <code className="flex-1 min-w-0 text-[12px] font-mono text-[var(--mkt-text-primary)] truncate">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label ?? "Copy to clipboard"}
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-[var(--mkt-text-secondary)] hover:bg-[var(--mkt-surface-elevated)] hover:text-[var(--mkt-text-primary)] transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
