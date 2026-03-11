"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

interface CopyBlockProps {
  code: string;
  language?: string;
}

export function CopyBlock({ code, language }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative rounded-xl bg-[#1e1e24] overflow-hidden">
      {language && (
        <div className="px-4 py-2 border-b border-white/[0.07] text-xs text-gray-500 font-mono">
          {language}
        </div>
      )}
      <button
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/[0.08] transition-all duration-150"
      >
        {copied ? (
          <>
            <Check size={13} />
            <span>Copied!</span>
          </>
        ) : (
          <Copy size={13} />
        )}
      </button>
      <pre className="overflow-x-auto p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
}
