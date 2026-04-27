"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type * as monacoType from "monaco-editor";
import { useTheme } from "next-themes";
import { STUDIO_THEME_DARK, STUDIO_THEME_LIGHT } from "@/lib/monaco/themes";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[var(--bg-surface)]">
      <p className="text-xs text-[var(--text-muted)]">Loading editor...</p>
    </div>
  ),
});

interface VariantCodeEditorProps {
  value: string;
  onChange: (next: string) => void;
  /** Set a single error marker on this line (1-indexed). null clears markers. */
  errorAt?: { line: number; column: number; message: string } | null;
  /** Debounce ms between last keystroke and onChange firing. Default 800ms. */
  debounceMs?: number;
}

export function VariantCodeEditor({ value, onChange, errorAt, debounceMs = 800 }: VariantCodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme("studio-dark", STUDIO_THEME_DARK);
    monaco.editor.defineTheme("studio-light", STUDIO_THEME_LIGHT);
    monaco.editor.setTheme(resolvedTheme === "light" ? "studio-light" : "studio-dark");

    // The variant runtime injects React as a global, so import-resolution
    // semantic checks would just spam errors. Keep syntactic checks (these
    // catch real parse errors like the AI typo we shipped a guard for).
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: "React.createElement",
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      esModuleInterop: true,
    });
  }, [resolvedTheme]);

  // Theme follow when the global theme switches.
  useEffect(() => {
    monacoRef.current?.editor.setTheme(resolvedTheme === "light" ? "studio-light" : "studio-dark");
  }, [resolvedTheme]);

  // Server-side transpile errors — show them as a Monaco marker so the
  // user sees a red squiggle on the offending line, not just "Failed to
  // render" in the preview pane.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;
    if (!errorAt) {
      monaco.editor.setModelMarkers(model, "transpile", []);
      return;
    }
    monaco.editor.setModelMarkers(model, "transpile", [{
      severity: monaco.MarkerSeverity.Error,
      message: errorAt.message,
      startLineNumber: errorAt.line,
      startColumn: errorAt.column,
      endLineNumber: errorAt.line,
      endColumn: errorAt.column + 1,
    }]);
  }, [errorAt]);

  const handleChange = useCallback((next: string | undefined) => {
    if (next === undefined) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangeRef.current(next);
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <MonacoEditor
      height="100%"
      language="typescript"
      path="component.tsx"
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      options={{
        fontSize: 13,
        lineHeight: 20,
        fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
        wordWrap: "on",
        minimap: { enabled: false },
        lineNumbers: "on",
        padding: { top: 12, bottom: 80 },
        scrollBeyondLastLine: false,
        overviewRulerBorder: false,
        bracketPairColorization: { enabled: true },
        renderLineHighlight: "line",
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
      }}
    />
  );
}
