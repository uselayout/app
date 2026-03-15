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
  { key: "mobile", label: "Mobile", width: 375, height: 812, icon: Smartphone },
  { key: "tablet", label: "Tablet", width: 768, height: 1024, icon: Tablet },
  { key: "desktop", label: "Desktop", width: 1280, height: 900, icon: Monitor },
] as const;

export function ResponsivePreview({ variant, onClose }: ResponsivePreviewProps) {
  const [activeViewport, setActiveViewport] = useState<string>("desktop");
  const active = VIEWPORTS.find((v) => v.key === activeViewport) ?? VIEWPORTS[2];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--studio-border)] bg-[var(--bg-panel)] px-5 py-3">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Responsive Preview
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">{variant.name}</p>
          </div>

          {/* Viewport tabs */}
          <div className="flex items-center rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-0.5">
            {VIEWPORTS.map(({ key, label, width, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveViewport(key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  activeViewport === key
                    ? "bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Icon size={12} />
                {label}
                <span className="text-[10px] text-[var(--text-muted)]">{width}px</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Single viewport preview — centred */}
      <div className="flex flex-1 items-start justify-center overflow-auto p-6">
        <ViewportFrame
          key={active.key}
          code={variant.code}
          width={active.width}
          height={active.height}
        />
      </div>
    </div>
  );
}

function ViewportFrame({
  code,
  width,
  height,
}: {
  code: string;
  width: number;
  height: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale to fit the container
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const container = containerRef.current.parentElement;
      if (!container) return;
      const availableWidth = container.clientWidth - 48; // 24px padding each side
      const availableHeight = container.clientHeight - 48;
      const scaleX = Math.min(1, availableWidth / width);
      const scaleY = Math.min(1, availableHeight / height);
      setScale(Math.min(scaleX, scaleY));
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width, height]);

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
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-3" ref={containerRef}>
      {/* Dimension label */}
      <p className="text-xs text-[var(--text-muted)]">
        {width} × {height}
      </p>

      <div
        className="relative overflow-hidden rounded-lg border border-[var(--studio-border)] bg-white"
        style={{
          width: width * scale,
          height: height * scale,
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
              height,
              transform: `scale(${scale})`,
            }}
            title={`Preview at ${width}px`}
          />
        )}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
          </div>
        )}
      </div>
    </div>
  );
}
