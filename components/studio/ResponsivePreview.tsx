"use client";

import { useState, useEffect, useRef } from "react";
import { X, Smartphone, Tablet, Monitor, ExternalLink } from "lucide-react";
import { extractComponentName, buildSrcdoc, sanitizeRelativeSrc } from "@/lib/explore/preview-helpers";
import type { DesignVariant } from "@/lib/types";

interface ResponsivePreviewProps {
  variant: DesignVariant;
  onClose: () => void;
  cssTokenBlock?: string;
}

const VIEWPORTS = [
  { key: "mobile", label: "Mobile", width: 375, height: 812, icon: Smartphone },
  { key: "tablet", label: "Tablet", width: 768, height: 1024, icon: Tablet },
  { key: "desktop", label: "Desktop", width: 1280, height: 900, icon: Monitor },
] as const;

export function ResponsivePreview({ variant, onClose, cssTokenBlock }: ResponsivePreviewProps) {
  const [activeViewport, setActiveViewport] = useState<string>("desktop");
  const active = VIEWPORTS.find((v) => v.key === activeViewport) ?? VIEWPORTS[2];
  const srcdocRef = useRef<string | null>(null);

  function handleOpenInTab() {
    if (!srcdocRef.current) return;
    const blob = new Blob([srcdocRef.current], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
      {/* Header */}
      <div className="relative flex items-center border-b border-[var(--studio-border)] bg-[var(--bg-panel)] px-5 py-3">
        {/* Left — title */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Responsive Preview
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">{variant.name}</span>
        </div>

        {/* Centre — viewport tabs */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-0.5">
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

        {/* Right — open in tab + close */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleOpenInTab}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={15} />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Single viewport preview — centred */}
      <div className="flex flex-1 items-start justify-center overflow-auto p-6">
        <ViewportFrame
          key={active.key}
          code={variant.code}
          width={active.width}
          height={active.height}
          onSrcdocReady={(s) => { srcdocRef.current = s; }}
          cssTokenBlock={cssTokenBlock}
        />
      </div>
    </div>
  );
}

function ViewportFrame({
  code,
  width,
  height,
  onSrcdocReady,
  cssTokenBlock,
}: {
  code: string;
  width: number;
  height: number;
  onSrcdocReady: (srcdoc: string) => void;
  cssTokenBlock?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSrcdocReadyRef = useRef(onSrcdocReady);
  onSrcdocReadyRef.current = onSrcdocReady;
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
          body: JSON.stringify({ code: sanitizeRelativeSrc(code) }),
        });

        if (!res.ok) {
          setError("Transpilation failed");
          return;
        }

        const { js } = await res.json();
        if (cancelled) return;

        const componentName = extractComponentName(code);
        const srcdoc = buildSrcdoc(js, componentName, { cssTokenBlock });

        onSrcdocReadyRef.current(srcdoc);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onSrcdocReady is a callback ref, not a render dependency
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
