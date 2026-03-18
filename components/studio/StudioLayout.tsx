"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";

interface StudioLayoutProps {
  sourcePanel: ReactNode;
  editorPanel: ReactNode;
  canvasPanel?: ReactNode;
  savedPanel?: ReactNode;
  centreView: "editor" | "canvas" | "saved";
  showSourcePanel?: boolean;
}

const MIN_PANEL_WIDTH = 200;
const DEFAULT_LEFT = 280;

export function StudioLayout({
  sourcePanel,
  editorPanel,
  canvasPanel,
  savedPanel,
  centreView,
  showSourcePanel = true,
}: StudioLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"left" | null>(null);
  const leftRef = useRef(leftWidth);
  leftRef.current = leftWidth;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingRef.current = "left";
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const totalWidth = rect.width;

    const newLeft = Math.max(
      MIN_PANEL_WIDTH,
      Math.min(e.clientX - rect.left, totalWidth - MIN_PANEL_WIDTH - 8)
    );
    setLeftWidth(newLeft);
  }, []);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden">
      {/* Left Panel */}
      {showSourcePanel && (
        <>
          <div
            className="shrink-0 overflow-hidden border-r border-[var(--studio-border)]"
            style={{ width: leftWidth }}
          >
            {sourcePanel}
          </div>

          {/* Left Resize Handle */}
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-[var(--studio-accent)]/30 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
          />
        </>
      )}

      {/* Centre Panel */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {centreView === "saved" && savedPanel
          ? savedPanel
          : centreView === "canvas" && canvasPanel
            ? canvasPanel
            : editorPanel}
      </div>

    </div>
  );
}
