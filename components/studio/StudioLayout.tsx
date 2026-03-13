"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";

interface StudioLayoutProps {
  sourcePanel: ReactNode;
  editorPanel: ReactNode;
  canvasPanel?: ReactNode;
  testPanel: ReactNode;
  centreView: "editor" | "canvas";
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
  showTestPanel = true,
}: StudioLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"left" | "right" | null>(null);

  const handleMouseDown = useCallback((side: "left" | "right") => {
    draggingRef.current = side;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !draggingRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;

      if (draggingRef.current === "left") {
        const newLeft = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(e.clientX - rect.left, totalWidth - rightWidth - MIN_PANEL_WIDTH - 8)
        );
        setLeftWidth(newLeft);
      } else {
        const newRight = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(rect.right - e.clientX, totalWidth - leftWidth - MIN_PANEL_WIDTH - 8)
        );
        setRightWidth(newRight);
      }
    };

    const handleMouseUp = () => {
      draggingRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftWidth, rightWidth]);

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden">
      {/* Left Panel */}
      <div
        className="shrink-0 overflow-hidden border-r border-[--studio-border]"
        style={{ width: leftWidth }}
      >
        {sourcePanel}
      </div>

      {/* Left Resize Handle */}
      <div
        className="w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-[--studio-accent]/30"
        onMouseDown={() => handleMouseDown("left")}
      />

      {/* Centre Panel */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {centreView === "canvas" && canvasPanel ? canvasPanel : editorPanel}
      </div>

      {/* Right Resize Handle + Panel (test panel toggle) */}
      {showTestPanel && (
        <>
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-[--studio-accent]/30"
            onMouseDown={() => handleMouseDown("right")}
          />
          <div
            className="shrink-0 overflow-hidden border-l border-[--studio-border]"
            style={{ width: rightWidth }}
          >
            {testPanel}
          </div>
        </>
      )}
    </div>
  );
}
