"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type * as monacoType from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[--bg-surface]">
      <p className="text-sm text-[--text-muted]">Loading editor...</p>
    </div>
  ),
});

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
}

const STUDIO_THEME: monacoType.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "heading", foreground: "E8E8F0", fontStyle: "bold" },
    { token: "emphasis", fontStyle: "italic" },
    { token: "strong", fontStyle: "bold" },
    { token: "keyword", foreground: "6366F1" },
    { token: "comment", foreground: "6B6B80" },
    { token: "string", foreground: "34D399" },
    { token: "variable", foreground: "A78BFA" },
  ],
  colors: {
    "editor.background": "#18181E",
    "editor.foreground": "#C8C8D0",
    "editor.lineHighlightBackground": "#1E1E26",
    "editor.selectionBackground": "#6366F140",
    "editorCursor.foreground": "#6366F1",
    "editor.inactiveSelectionBackground": "#6366F120",
    "editorLineNumber.foreground": "#3A3A48",
    "editorGutter.background": "#18181E",
    "editorWidget.background": "#111115",
    "editorWidget.border": "#2A2A36",
    "editorSuggestWidget.background": "#111115",
    "editorSuggestWidget.border": "#2A2A36",
    "editorSuggestWidget.selectedBackground": "#6366F130",
  },
};

export function EditorPanel({ value, onChange }: EditorPanelProps) {
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokenCount = useMemo(() => Math.round(value.length / 4), [value]);
  const tokenColour =
    tokenCount < 4000
      ? "text-emerald-400"
      : tokenCount < 8000
        ? "text-yellow-400"
        : "text-red-400";

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue === undefined) return;

      setSaveStatus("saving");
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        onChange(newValue);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }, 2000);
    },
    [onChange]
  );

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("studio-dark", STUDIO_THEME);
    monaco.editor.setTheme("studio-dark");
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex h-full flex-col bg-[--bg-surface]">
      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-[--studio-border] px-4 py-2">
        <span className="text-xs font-medium text-[--text-muted]">
          DESIGN.md
        </span>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="text-xs text-[--text-muted]">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-400">Saved</span>
          )}
          <span className={`text-xs ${tokenColour}`}>
            ~{tokenCount.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language="markdown"
          value={value}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            wordWrap: "on",
            fontSize: 14,
            lineHeight: 22,
            fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
            minimap: { enabled: false },
            lineNumbers: "off",
            padding: { top: 20, bottom: 80 },
            scrollBeyondLastLine: false,
            renderWhitespace: "none",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            bracketPairColorization: { enabled: false },
          }}
        />
      </div>
    </div>
  );
}
