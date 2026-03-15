"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";

interface StudioLayoutProps {
  sourcePanel: ReactNode;
  editorPanel: ReactNode;
  canvasPanel?: ReactNode;
  testPanel: ReactNode;
  centreView: "editor" | "canvas";
  showSourcePanel?: boolean;
  showTestPanel?: boolean;
}

const MIN_PANEL_WIDTH = 200;
const DEFAULT_LEFT = 280;
const DEFAULT_RIGHT = 340;

export function StudioLayout({
  sourcePanel,
  editorPanel,
  canvasPanel,
  testPanel,
  centreView,
  showSourcePanel = true,
  showTestPanel = true,
}: StudioLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"left" | "right" | null>(null);
  const leftRef = useRef(leftWidth);
  const rightRef = useRef(rightWidth);
  leftRef.current = leftWidth;
  rightRef.current = rightWidth;

  const handlePointerDown = useCallback((e: React.PointerEvent, side: "left" | "right") => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingRef.current = side;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const totalWidth = rect.width;

    if (draggingRef.current === "left") {
      const newLeft = Math.max(
        MIN_PANEL_WIDTH,
        Math.min(e.clientX - rect.left, totalWidth - rightRef.current - MIN_PANEL_WIDTH - 8)
      );
      setLeftWidth(newLeft);
    } else {
      const newRight = Math.max(
        MIN_PANEL_WIDTH,
        Math.min(rect.right - e.clientX, totalWidth - leftRef.current - MIN_PANEL_WIDTH - 8)
      );
      setRightWidth(newRight);
    }
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
            onPointerDown={(e) => handlePointerDown(e, "left")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
          />
        </>
      )}

      {/* Centre Panel */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {centreView === "canvas" && canvasPanel ? canvasPanel : editorPanel}
      </div>

      {/* Right Resize Handle + Panel (test panel toggle) */}
      {showTestPanel && (
        <>
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-[var(--studio-accent)]/30 touch-none"
            onPointerDown={(e) => handlePointerDown(e, "right")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
          />
          <div
            className="shrink-0 overflow-hidden border-l border-[var(--studio-border)]"
            style={{ width: rightWidth }}
          >
            {testPanel}
          </div>
        </>
      )}
    </div>
  );
}
