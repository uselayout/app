"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type * as monacoType from "monaco-editor";
import { ArrowUp, Undo2, Loader2, History, X } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import type { LayoutMdVersion } from "@/lib/supabase/layout-md-versions";
import type { ExtractionResult } from "@/lib/types";
import { DivergenceBanner } from "./DivergenceBanner";
import { findDerivedRanges, rangeOverlapsDerived, type DerivedRange } from "@/lib/layout-md/derived-ranges";

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
  projectId?: string;
  orgId?: string;
  extractionData?: ExtractionResult;
}

const STUDIO_THEME_DARK: monacoType.editor.IStandaloneThemeData = {
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

const STUDIO_THEME_LIGHT: monacoType.editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "heading", foreground: "1A1A1A", fontStyle: "bold" },
    { token: "emphasis", fontStyle: "italic" },
    { token: "strong", fontStyle: "bold" },
    { token: "keyword", foreground: "7c3aed" },
    { token: "comment", foreground: "9CA3AF" },
    { token: "string", foreground: "059669" },
    { token: "variable", foreground: "7c3aed" },
  ],
  colors: {
    "editor.background": "#FFFFFF",
    "editor.foreground": "#1A1A1A",
    "editor.lineHighlightBackground": "#F5F5F5",
    "editor.selectionBackground": "#1A1A1A20",
    "editorCursor.foreground": "#1A1A1A",
    "editor.inactiveSelectionBackground": "#1A1A1A10",
    "editorLineNumber.foreground": "#C0C0C0",
    "editorGutter.background": "#FFFFFF",
    "editorWidget.background": "#FAFAFA",
    "editorWidget.border": "#E0E0E3",
    "editorSuggestWidget.background": "#FAFAFA",
    "editorSuggestWidget.border": "#E0E0E3",
    "editorSuggestWidget.selectedBackground": "#EBEBED",
  },
};

export function EditorPanel({ value, onChange, tokenSuggestions = [], projectId, orgId, extractionData }: EditorPanelProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<LayoutMdVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<LayoutMdVersion | null>(null);

  const loadVersions = useCallback(async () => {
    if (!projectId || !orgId) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/projects/${projectId}/layout-md-versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingVersions(false);
    }
  }, [projectId, orgId]);

  const handleOpenHistory = useCallback(() => {
    setShowHistory(true);
    setPreviewVersion(null);
    loadVersions();
  }, [loadVersions]);

  const handleRestore = useCallback((version: LayoutMdVersion) => {
    editorRef.current?.setValue(version.layoutMd);
    onChange(version.layoutMd);
    setShowHistory(false);
    setPreviewVersion(null);
  }, [onChange]);

  const tokenCount = useMemo(() => Math.round(value.length / 4), [value]);
  const tokenBadge =
    tokenCount < 4000
      ? "bg-[var(--status-success)] text-white"
      : tokenCount < 8000
        ? "bg-[var(--status-warning)] text-black"
        : "bg-[var(--status-error)] text-white";

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

  // Cross-panel scroll: other components (e.g. the Design System page) can
  // dispatch a `layout-scroll-to-section` CustomEvent with { match: RegExp }
  // to jump the editor to a specific heading. Used by "Fix in layout.md".
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ match: string }>).detail;
      if (!detail?.match) return;
      const re = new RegExp(detail.match, "i");
      const target = sections.find((s) => re.test(s.label));
      if (target) scrollToLine(target.line);
    };
    window.addEventListener("layout-scroll-to-section", handler);
    return () => window.removeEventListener("layout-scroll-to-section", handler);
  }, [sections, scrollToLine]);

  const suggestionsRef = useRef(tokenSuggestions);
  suggestionsRef.current = tokenSuggestions;

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("studio-dark", STUDIO_THEME_DARK);
    monaco.editor.defineTheme("studio-light", STUDIO_THEME_LIGHT);
    monaco.editor.setTheme(resolvedTheme === "light" ? "studio-light" : "studio-dark");

    // Apply decorations once on mount and re-apply whenever the content
    // changes (derived ranges shift with every edit in authored prose).
    const model = editor.getModel();
    if (model) {
      applyDerivedDecorations(editor);

      model.onDidChangeContent((e) => {
        // Skip the change if we're programmatically reverting — the guard
        // below fires its own model.pushEditOperations and we'd recurse.
        if (revertingRef.current) return;

        // Check each change against the current derived ranges. If any edit
        // overlaps, revert by restoring the pre-change text at that spot.
        const ranges = derivedRangesRef.current;
        if (ranges.length > 0) {
          const offendingChange = e.changes.find((c) => {
            const hit = rangeOverlapsDerived(
              c.range.startLineNumber,
              c.range.endLineNumber,
              ranges
            );
            return Boolean(hit);
          });

          if (offendingChange) {
            const hit = rangeOverlapsDerived(
              offendingChange.range.startLineNumber,
              offendingChange.range.endLineNumber,
              ranges
            );
            // Undo via editor stack — preserves cursor and undo history.
            revertingRef.current = true;
            try {
              editor.trigger("derived-guard", "undo", null);
            } finally {
              revertingRef.current = false;
            }
            toast.info(
              `${hit?.label ?? "That section"} is built from your design system — typing here won't stick. Open the ${hit?.editIn ?? "Tokens"} tab to edit it.`
            );
            return;
          }
        }

        // Authored edit — recompute derived ranges and refresh decorations.
        applyDerivedDecorations(editor);
      });
    }

    // Register colour provider — shows inline swatches with a picker in CSS blocks
    monaco.languages.registerColorProvider("markdown", {
      provideDocumentColors: (model: monacoType.editor.ITextModel) => {
        const colors: monacoType.languages.IColorInformation[] = [];
        const hexRegex = /#([0-9a-fA-F]{6})\b/g;
        const lineCount = model.getLineCount();

        for (let i = 1; i <= lineCount; i++) {
          const lineContent = model.getLineContent(i);
          let match: RegExpExecArray | null;
          hexRegex.lastIndex = 0;
          while ((match = hexRegex.exec(lineContent)) !== null) {
            const hex = match[1];
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            colors.push({
              color: { red: r, green: g, blue: b, alpha: 1 },
              range: {
                startLineNumber: i,
                startColumn: match.index + 1,
                endLineNumber: i,
                endColumn: match.index + 1 + match[0].length,
              },
            });
          }
        }

        return { colors, dispose: () => {} };
      },
      provideColorPresentations: (
        _model: monacoType.editor.ITextModel,
        colorInfo: monacoType.languages.IColorInformation
      ) => {
        const { red, green, blue } = colorInfo.color;
        const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
        const hex = `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
        return [{ label: hex }];
      },
    });

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
  }, [resolvedTheme]);

  // Switch Monaco theme when app theme changes
  useEffect(() => {
    if (!editorRef.current) return;
    const monaco = (window as unknown as Record<string, unknown>).monaco as typeof monacoType | undefined;
    if (monaco) {
      monaco.editor.setTheme(resolvedTheme === "light" ? "studio-light" : "studio-dark");
    }
  }, [resolvedTheme]);

  // Derived-block guard: the derive engine regenerates CORE TOKENS,
  // Appendix A, Brand Assets, Icons, Component Inventory and Product
  // Context on every read. Edits to those ranges in Monaco would be silently
  // thrown away. Decorate the ranges as "derived" and revert edits that
  // touch them so users never lose work without warning.
  const derivedRangesRef = useRef<DerivedRange[]>([]);
  const decorationsRef = useRef<string[]>([]);
  const revertingRef = useRef(false);

  const applyDerivedDecorations = useCallback((editor: monacoType.editor.IStandaloneCodeEditor) => {
    const model = editor.getModel();
    if (!model) return;
    const ranges = findDerivedRanges(model.getValue());
    derivedRangesRef.current = ranges;

    const newDecorations: monacoType.editor.IModelDeltaDecoration[] = ranges.map((r) => ({
      range: {
        startLineNumber: r.startLine,
        startColumn: 1,
        endLineNumber: r.endLine,
        endColumn: model.getLineMaxColumn(Math.min(r.endLine, model.getLineCount())),
      },
      options: {
        isWholeLine: true,
        className: "layout-md-derived-range",
        linesDecorationsClassName: "layout-md-derived-gutter",
        hoverMessage: [
          { value: `**${r.label}**` },
          { value: `Layout Studio builds this section from your design system every time it reads \`layout.md\`. Anything typed here gets overwritten — edit it in the **${r.editIn}** tab instead.` },
        ],
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
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
          layout.md
        </span>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="text-xs text-[var(--text-muted)]">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-[var(--status-success)]">Saved</span>
          )}
          {projectId && orgId && (
            <button
              onClick={handleOpenHistory}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
              title="Version history"
            >
              <History size={12} />
              History
            </button>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${tokenBadge}`}
          >
            ~{tokenCount.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* Token ↔ extraction data divergence warning */}
      <DivergenceBanner
        layoutMd={value}
        extraction={extractionData}
        storageKey={projectId}
      />

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

      {/* Version History Panel */}
      {showHistory && (
        <div className="border-t border-[var(--studio-border)] bg-[var(--bg-panel)]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--studio-border)]">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Version History</span>
            <button
              onClick={() => { setShowHistory(false); setPreviewVersion(null); }}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loadingVersions ? (
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--text-muted)]">
                <Loader2 size={12} className="animate-spin" /> Loading versions…
              </div>
            ) : versions.length === 0 ? (
              <p className="px-4 py-3 text-xs text-[var(--text-muted)]">No previous versions saved yet.</p>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between px-4 py-2 border-b border-[var(--studio-border)] last:border-b-0 hover:bg-[var(--bg-hover)] transition-colors ${previewVersion?.id === v.id ? "bg-[var(--bg-hover)]" : ""}`}
                >
                  <button
                    onClick={() => setPreviewVersion(previewVersion?.id === v.id ? null : v)}
                    className="flex-1 text-left"
                  >
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(v.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                      {v.source} · {Math.round(v.layoutMd.length / 4)} tokens
                    </span>
                  </button>
                  <button
                    onClick={() => handleRestore(v)}
                    className="shrink-0 rounded px-2 py-1 text-[10px] font-medium text-[var(--studio-accent)] hover:bg-[var(--studio-accent-subtle)] transition-colors"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
          {previewVersion && (
            <div className="border-t border-[var(--studio-border)] px-4 py-2">
              <pre className="max-h-32 overflow-y-auto text-[10px] text-[var(--text-muted)] font-mono whitespace-pre-wrap">
                {previewVersion.layoutMd.slice(0, 2000)}
                {previewVersion.layoutMd.length > 2000 && "…"}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* AI Edit Chat Bar */}
      <EditorChatBar value={value} onChange={onChange} editorRef={editorRef} projectId={projectId} orgId={orgId} />
    </div>
  );
}

function EditorChatBar({
  value,
  onChange,
  editorRef,
  projectId,
  orgId,
}: {
  value: string;
  onChange: (value: string) => void;
  editorRef: React.RefObject<monacoType.editor.IStandaloneCodeEditor | null>;
  projectId?: string;
  orgId?: string;
}) {
  const [instruction, setInstruction] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
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
    setStreamStatus("Thinking...");
    setShowUndo(false);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Save current version before AI overwrites it
    if (projectId && orgId && value.trim()) {
      fetch(`/api/organizations/${orgId}/projects/${projectId}/layout-md-versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutMd: value, source: "manual" }),
      }).catch(() => {});
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const apiKey = getStoredApiKey();
      if (apiKey) headers["X-Api-Key"] = apiKey;

      const res = await fetch("/api/generate/edit-layout-md", {
        method: "POST",
        headers,
        body: JSON.stringify({ instruction: instruction.trim(), layoutMd: value }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errBody.error || `Request failed (${res.status})`);
      }

      const newLayoutMd = await res.text();
      const appliedCount = Number(res.headers.get("X-Applied-Edits")) || 0;

      // Apply once at the end — no progressive rewriting of the whole file.
      editorRef.current?.setValue(newLayoutMd);
      onChange(newLayoutMd);
      setInstruction("");

      toast.success(
        appliedCount === 1 ? "1 edit applied" : `${appliedCount} edits applied`
      );

      // Show undo toast
      setShowUndo(true);
      undoTimerRef.current = setTimeout(() => {
        setShowUndo(false);
        setPreviousValue(null);
      }, 8000);
    } catch (err) {
      console.error("AI edit failed:", err);
      toast.error(err instanceof Error ? err.message : "AI edit failed");
      setPreviousValue(null);
    } finally {
      setIsStreaming(false);
      setStreamStatus(null);
    }
  }, [instruction, isStreaming, value, onChange, editorRef, projectId, orgId]);

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
      <div className="mx-3 mb-3 mt-3 flex flex-col rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)]">
        <div className="relative p-2.5">
          <div className="flex min-h-[68px] items-start rounded-md border border-[var(--studio-border)] bg-[var(--studio-accent-subtle)] px-3.5 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
            <input
              ref={inputRef}
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Layout to edit your design system..."
              disabled={isStreaming}
              className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none disabled:opacity-50"
            />
          </div>
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5">
            {isStreaming ? (
              <div className="flex items-center gap-2">
                {streamStatus && (
                  <span className="text-[11px] text-[var(--text-muted)] animate-pulse">
                    {streamStatus}
                  </span>
                )}
                <div className="flex items-center justify-center size-6">
                  <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                </div>
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
        <div className="mx-3 mb-3 flex items-center justify-between rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2">
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
