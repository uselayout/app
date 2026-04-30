import type * as monacoType from "monaco-editor";

export const STUDIO_THEME_DARK: monacoType.editor.IStandaloneThemeData = {
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

export const STUDIO_THEME_LIGHT: monacoType.editor.IStandaloneThemeData = {
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
