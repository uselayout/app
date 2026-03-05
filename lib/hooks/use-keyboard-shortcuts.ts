"use client";

import { useEffect } from "react";

interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onTest?: () => void;
  onExport?: () => void;
  onFocusSource?: () => void;
  onFocusEditor?: () => void;
  onFocusTest?: () => void;
  onToggleLeft?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        handlers.onSave?.();
      } else if (e.key === "t" && !e.shiftKey) {
        e.preventDefault();
        handlers.onTest?.();
      } else if (e.key === "e" && e.shiftKey) {
        e.preventDefault();
        handlers.onExport?.();
      } else if (e.key === "1") {
        e.preventDefault();
        handlers.onFocusSource?.();
      } else if (e.key === "2") {
        e.preventDefault();
        handlers.onFocusEditor?.();
      } else if (e.key === "3") {
        e.preventDefault();
        handlers.onFocusTest?.();
      } else if (e.key === "b" && !e.shiftKey) {
        e.preventDefault();
        handlers.onToggleLeft?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
