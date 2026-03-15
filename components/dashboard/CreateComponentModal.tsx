"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Loader2, Save, ArrowUp, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useOrgStore } from "@/lib/store/organization";
import { extractComponentName, buildSrcdoc } from "@/lib/explore/preview-helpers";
import { useRouter, useParams } from "next/navigation";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[--bg-surface]">
      <p className="text-sm text-[--text-muted]">Loading editor...</p>
    </div>
  ),
});

interface CreateComponentModalProps {
  orgSlug: string;
  onClose: () => void;
  onCreated?: () => void;
}

const DEFAULT_CODE = `export default function MyComponent() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">My Component</h2>
      <p className="text-gray-500 mt-2">Start editing to preview.</p>
    </div>
  );
}
`;

export function CreateComponentModal({
  orgSlug,
  onClose,
  onCreated,
}: CreateComponentModalProps) {
  const router = useRouter();
  const params = useParams();
  const projectId = (params?.projectId as string) ?? "";
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI chat state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Preview state
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transpile and render preview on debounced code change
  useEffect(() => {
    if (!code.trim()) return;

    setPreviewReady(false);
    setPreviewError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      let cancelled = false;

      async function transpileAndRender() {
        try {
          const res = await fetch("/api/transpile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });

          if (!res.ok) {
            if (!cancelled) setPreviewError("Transpilation failed");
            return;
          }

          const { js } = await res.json();
          if (cancelled) return;

          const componentName = extractComponentName(code);
          const srcdoc = buildSrcdoc(js, componentName);

          if (iframeRef.current && !cancelled) {
            iframeRef.current.srcdoc = srcdoc;
            setPreviewReady(true);
          }
        } catch (err) {
          if (!cancelled) {
            setPreviewError(err instanceof Error ? err.message : "Preview failed");
          }
        }
      }

      transpileAndRender();

      return () => {
        cancelled = true;
      };
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code]);

  const handleSave = useCallback(async () => {
    if (!orgId || !name.trim() || !code.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/organizations/${orgId}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code,
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          source: "manual" as const,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to save component" }));
        throw new Error(body.error ?? "Failed to save component");
      }

      const created = await res.json();
      onCreated?.();
      onClose();

      // Navigate to the new component detail page
      if (created.slug) {
        const libraryBase = projectId
          ? `/${orgSlug}/projects/${projectId}/library`
          : `/${orgSlug}/library`;
        router.push(`${libraryBase}/${created.slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [orgId, name, code, description, category, tagsInput, onClose, onCreated, orgSlug, router]);

  const handleAiGenerate = useCallback(async () => {
    const trimmed = aiPrompt.trim();
    if (!trimmed || aiGenerating) return;

    setAiGenerating(true);

    try {
      const systemContext = code !== DEFAULT_CODE
        ? `The user has existing component code:\n\`\`\`tsx\n${code}\n\`\`\`\n\nModify or improve it based on the user's request. Return ONLY the complete TSX component code, no explanations.`
        : `Generate a React component based on the user's request. Return ONLY the complete TSX component code with a default export, no explanations.`;

      const res = await fetch("/api/generate/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${systemContext}\n\nUser request: ${trimmed}`,
          includeContext: true,
        }),
      });

      if (!res.ok) throw new Error("AI generation failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      // Extract code from markdown code blocks if present
      const codeMatch = accumulated.match(/```(?:tsx?|jsx?|react)?\s*\n([\s\S]*?)```/);
      const extractedCode = codeMatch ? codeMatch[1].trim() : accumulated.trim();

      if (extractedCode) {
        setCode(extractedCode);
        // Auto-detect component name for the name field
        const nameMatch = extractedCode.match(/(?:export\s+default\s+function|function)\s+(\w+)/);
        if (nameMatch && !name.trim()) {
          setName(nameMatch[1]);
        }
      }

      setAiPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiGenerating(false);
    }
  }, [aiPrompt, aiGenerating, code, name]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[--bg-app]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[--studio-border] px-5 py-3">
        <h2 className="text-sm font-semibold text-[--text-primary]">
          Create Component
        </h2>
        <div className="flex items-center gap-2">
          {error && (
            <p className="text-xs text-red-400 mr-2">{error}</p>
          )}
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !code.trim() || !orgId}
            className="flex items-center gap-1.5 rounded-lg bg-[--studio-accent] px-4 py-1.5 text-xs font-medium text-[--text-on-accent] hover:bg-[--studio-accent-hover] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={12} />
                Save Component
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[--text-muted] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Form fields */}
      <div className="flex items-center gap-3 border-b border-[--studio-border] px-5 py-3">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Component name *"
            className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-1.5 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
          />
        </div>
        <div className="w-40">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-1.5 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-1.5 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
          />
        </div>
        <div className="w-48">
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-1.5 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
          />
        </div>
      </div>

      {/* Editor + Preview split */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Monaco editor */}
        <div className="flex-1 border-r border-[--studio-border]">
          <div className="flex items-center border-b border-[--studio-border] px-4 py-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
              TSX Code
            </span>
          </div>
          <div className="h-[calc(100%-33px)]">
            <MonacoEditor
              height="100%"
              language="typescriptreact"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              options={{
                wordWrap: "on",
                fontSize: 13,
                lineHeight: 20,
                fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
                minimap: { enabled: false },
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                renderWhitespace: "none",
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
                bracketPairColorization: { enabled: true },
                tabSize: 2,
              }}
              theme="vs-dark"
            />
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center border-b border-[--studio-border] px-4 py-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
              Preview
            </span>
          </div>
          <div className="flex-1 relative bg-white">
            {previewError ? (
              <div className="flex h-full items-center justify-center p-4">
                <p className="text-xs text-red-500">{previewError}</p>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                sandbox="allow-scripts"
                className={`h-full w-full border-0 transition-opacity ${
                  previewReady ? "opacity-100" : "opacity-0"
                }`}
                title="Component preview"
              />
            )}
            {!previewReady && !previewError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[--studio-accent]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Bar */}
      <div className="border-t border-[--studio-border] px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="shrink-0 text-[--studio-accent]" />
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAiGenerate();
              }
            }}
            placeholder={code !== DEFAULT_CODE
              ? "Ask AI to modify this component... e.g. \"add a dark mode toggle\""
              : "Ask AI to generate a component... e.g. \"a pricing card with 3 tiers\""
            }
            disabled={aiGenerating}
            className="flex-1 bg-transparent text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none disabled:opacity-50"
          />
          {aiGenerating ? (
            <Loader2 size={14} className="shrink-0 animate-spin text-[--studio-accent]" />
          ) : (
            <button
              onClick={handleAiGenerate}
              disabled={!aiPrompt.trim()}
              className="flex shrink-0 items-center justify-center size-6 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[--text-muted] transition-colors hover:text-[--text-primary] disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ArrowUp size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
        <p className="mt-1 text-[10px] text-[--text-muted]">
          {"\u2318"}+Enter to send
        </p>
      </div>
    </div>
  );
}
