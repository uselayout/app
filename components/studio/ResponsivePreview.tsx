"use client";

import { useState, useEffect, useRef } from "react";
import { X, Smartphone, Tablet, Monitor } from "lucide-react";
import { extractComponentName, buildSrcdoc } from "@/lib/explore/preview-helpers";
import type { DesignVariant } from "@/lib/types";

interface ResponsivePreviewProps {
  variant: DesignVariant;
  onClose: () => void;
}

const VIEWPORTS = [
  { label: "Mobile", width: 375, icon: Smartphone },
  { label: "Tablet", width: 768, icon: Tablet },
  { label: "Desktop", width: 1280, icon: Monitor },
] as const;

export function ResponsivePreview({ variant, onClose }: ResponsivePreviewProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--studio-border] bg-[--bg-panel] px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[--text-primary]">
            Responsive Preview
          </h2>
          <p className="text-xs text-[--text-secondary]">{variant.name}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-[--text-muted] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Viewports */}
      <div className="flex flex-1 items-start justify-center gap-6 overflow-auto p-6">
        {VIEWPORTS.map(({ label, width, icon: Icon }) => (
          <div key={width} className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[--text-secondary]">
              <Icon size={12} />
              {label} ({width}px)
            </div>
            <ViewportFrame
              code={variant.code}
              width={width}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewportFrame({ code, width }: { code: string; width: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setReady(false);
    setError(null);

    let cancelled = false;

    async function transpileAndRender() {
      try {
        const res = await fetch("/api/transpile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          setError("Transpilation failed");
          return;
        }

        const { js } = await res.json();
        if (cancelled) return;

        const componentName = extractComponentName(code);
        const srcdoc = buildSrcdoc(js, componentName);

        if (iframeRef.current) {
          iframeRef.current.srcdoc = srcdoc;
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Preview failed");
        }
      }
    }

    transpileAndRender();
    return () => { cancelled = true; };
  }, [code]);

  // Scale factor to fit in available space
  const maxDisplayWidth = 400;
  const scale = Math.min(1, maxDisplayWidth / width);

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-[--studio-border] bg-white"
      style={{
        width: width * scale,
        height: 600 * scale,
      }}
    >
      {error ? (
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          className={`border-0 origin-top-left transition-opacity ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          style={{
            width,
            height: 600,
            transform: `scale(${scale})`,
          }}
          title={`Preview at ${width}px`}
        />
      )}
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[--studio-border-strong] border-t-[--studio-accent]" />
        </div>
      )}
    </div>
  );
}

