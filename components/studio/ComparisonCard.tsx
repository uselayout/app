"use client";

import { GitCompareArrows, Trash2, Eye } from "lucide-react";
import type { ComparisonResult } from "@/lib/types";
import { buildSrcdoc, extractComponentName, sanitizeRelativeSrc } from "@/lib/explore/preview-helpers";
import { useEffect, useRef, useState } from "react";

interface ComparisonCardProps {
  comparison: ComparisonResult;
  onView: () => void;
  onDelete: () => void;
}

function MiniPreview({ code, label }: { code: string; label: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/transpile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: sanitizeRelativeSrc(code) }),
        });
        if (!res.ok || cancelled) return;
        const { js } = await res.json();
        if (cancelled) return;
        const name = extractComponentName(code);
        const srcdoc = buildSrcdoc(js, name);
        if (iframeRef.current && !cancelled) {
          iframeRef.current.srcdoc = srcdoc;
        }
      } catch {
        // Silently fail — preview is non-critical
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="relative flex-1 overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        onLoad={() => setReady(true)}
        sandbox="allow-scripts"
        className={`pointer-events-none h-[400px] w-[400px] origin-top-left transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
        style={{ transform: "scale(0.35)" }}
        title={label}
      />
      <div className="absolute bottom-1 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white/80">
        {label}
      </div>
    </div>
  );
}

export function ComparisonCard({ comparison, onView, onDelete }: ComparisonCardProps) {
  return (
    <div
      className="group relative flex flex-col rounded-xl border border-amber-500/20 bg-[var(--bg-surface)] transition-colors hover:border-amber-500/40 cursor-pointer"
      onClick={onView}
    >
      {/* Split preview */}
      <div className="relative flex aspect-[4/3] overflow-hidden rounded-t-xl">
        <MiniPreview code={comparison.withoutDs.code} label="Without" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--studio-border)]" />
        <MiniPreview code={comparison.withDs.code} label="With DS" />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GitCompareArrows size={13} className="shrink-0 text-amber-500/70" />
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--text-primary)]">
          {comparison.prompt}
        </p>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title="View comparison"
          >
            <Eye size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-hover)] transition-colors"
            title="Delete comparison"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
