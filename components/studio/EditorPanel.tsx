"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type * as monacoType from "monaco-editor";
import { ArrowUp, Undo2, Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[var(--bg-surface)]">
      <p className="text-sm text-[var(--text-muted)]">Loading editor...</p>
    </div>
  ),
});

interface TokenSuggestion {
  name: string;
  value: string;
}

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  tokenSuggestions?: TokenSuggestion[];
}

const STUDIO_THEME: monacoType.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "heading", foreground: "E8E8F0", fontStyle: "bold" },
    { token: "emphasis", fontStyle: "italic" },
    { token: "strong", fontStyle: "bold" },
    { token: "keyword", foreground: "e4f222" },
    { token: "comment", foreground: "6B6B80" },
    { token: "string", foreground: "34D399" },
    { token: "variable", foreground: "A78BFA" },
  ],
  colors: {
    "editor.background": "#18181E",
    "editor.foreground": "#C8C8D0",
    "editor.lineHighlightBackground": "#1E1E26",
    "editor.selectionBackground": "#E0E0E630",
    "editorCursor.foreground": "#E0E0E6",
    "editor.inactiveSelectionBackground": "#E0E0E615",
    "editorLineNumber.foreground": "#3A3A48",
    "editorGutter.background": "#18181E",
    "editorWidget.background": "#111115",
    "editorWidget.border": "#2A2A36",
    "editorSuggestWidget.background": "#111115",
    "editorSuggestWidget.border": "#2A2A36",
    "editorSuggestWidget.selectedBackground": "#E0E0E625",
  },
};

export function EditorPanel({ value, onChange, tokenSuggestions = [] }: EditorPanelProps) {
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

  // Section navigator: extract ## headings
  const sections = useMemo(() => {
    const headings: { label: string; line: number }[] = [];
    const lines = value.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^##\s+(.+)/);
      if (match) {
        headings.push({ label: match[1].trim(), line: i + 1 });
      }
    }
    return headings;
  }, [value]);

  const scrollToLine = useCallback((line: number) => {
    editorRef.current?.revealLineInCenter(line);
    editorRef.current?.setPosition({ lineNumber: line, column: 1 });
    editorRef.current?.focus();
  }, []);

  const suggestionsRef = useRef(tokenSuggestions);
  suggestionsRef.current = tokenSuggestions;

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("studio-dark", STUDIO_THEME);
    monaco.editor.setTheme("studio-dark");

    // Register token autocomplete
    monaco.languages.registerCompletionItemProvider("markdown", {
      triggerCharacters: ["-"],
      provideCompletionItems: (model: monacoType.editor.ITextModel, position: monacoType.Position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        if (!textUntilPosition.includes("--")) {
          return { suggestions: [] };
        }

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monacoType.languages.CompletionItem[] =
          suggestionsRef.current.map((token) => ({
            label: token.name,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: token.name,
            detail: token.value,
            documentation: `CSS variable: ${token.name}\nValue: ${token.value}`,
            range,
          }));

        return { suggestions };
      },
    });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex h-full flex-col bg-[var(--bg-surface)]">
      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-4 py-2">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          DESIGN.md
        </span>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="text-xs text-[var(--text-muted)]">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-400">Saved</span>
          )}
          <span className={`text-xs ${tokenColour}`}>
            ~{tokenCount.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* Section navigator */}
      {sections.length > 0 && (
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--studio-border)] px-4 py-1.5">
          {sections.map((section) => (
            <button
              key={section.line}
              onClick={() => scrollToLine(section.line)}
              className="shrink-0 rounded px-2 py-0.5 text-[10px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="min-h-0 flex-1">
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

      {/* AI Edit Chat Bar */}
      <EditorChatBar value={value} onChange={onChange} editorRef={editorRef} />
    </div>
  );
}

function EditorChatBar({
  value,
  onChange,
  editorRef,
}: {
  value: string;
  onChange: (value: string) => void;
  editorRef: React.RefObject<monacoType.editor.IStandaloneCodeEditor | null>;
}) {
  const [instruction, setInstruction] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!instruction.trim() || isStreaming) return;

    setPreviousValue(value);
    setIsStreaming(true);
    setShowUndo(false);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    try {
      const res = await fetch("/api/generate/edit-design-md", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruction.trim(), designMd: value }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errBody.error || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(chunk, { stream: true });
      }

      if (accumulated.startsWith("\n\n[Error:")) {
        throw new Error(accumulated);
      }

      // Apply the updated DESIGN.md
      editorRef.current?.setValue(accumulated);
      onChange(accumulated);
      setInstruction("");

      // Show undo toast
      setShowUndo(true);
      undoTimerRef.current = setTimeout(() => {
        setShowUndo(false);
        setPreviousValue(null);
      }, 8000);
    } catch (err) {
      console.error("AI edit failed:", err);
      // Restore previous value on error
      setPreviousValue(null);
    } finally {
      setIsStreaming(false);
    }
  }, [instruction, isStreaming, value, onChange, editorRef]);

  const handleUndo = useCallback(() => {
    if (previousValue === null) return;
    editorRef.current?.setValue(previousValue);
    onChange(previousValue);
    setPreviousValue(null);
    setShowUndo(false);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [previousValue, onChange, editorRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="border-t border-[var(--studio-border)]">
      <div className="mx-3 mb-3 mt-3 flex flex-col rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#161718]">
        <div className="relative p-2.5">
          <div className="flex min-h-[44px] items-center rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] px-3.5 py-2.5 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
            <input
              ref={inputRef}
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Layout to edit your design system..."
              disabled={isStreaming}
              className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[#898d94] outline-none disabled:opacity-50"
            />
          </div>
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5">
            {isStreaming ? (
              <div className="flex items-center justify-center size-6">
                <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
              </div>
            ) : instruction.trim() ? (
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center size-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-app)] transition-colors hover:opacity-90"
              >
                <ArrowUp size={12} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Undo toast */}
      {showUndo && (
        <div className="mx-3 mb-3 flex items-center justify-between rounded-md border border-[rgba(255,255,255,0.08)] bg-[var(--bg-elevated)] px-3 py-2">
          <span className="text-xs text-[var(--text-secondary)]">
            AI edit applied
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
          >
            <Undo2 size={12} />
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
