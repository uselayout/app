"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  ArrowUp,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Figma,
  ArrowUpToLine,
} from "lucide-react";
import { calculateHealthScore } from "@/lib/health/score";
import { friendlyError } from "@/lib/explore/friendly-error";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { usePushToDs } from "@/lib/hooks/use-push-to-ds";
import { useProjectStore } from "@/lib/store/project";
import { FigmaPushModal, toFrameName } from "@/components/studio/FigmaPushModal";
import type { TestResult, HealthScore, DesignVariant } from "@/lib/types";

export interface TestPanelHandle {
  focusPrompt: () => void;
}

interface TestPanelProps {
  projectId: string;
  designMd: string;
  components?: string[];
  extractedFonts?: string[];
  initialResults?: TestResult[];
  includeContext?: boolean;
  onToggleContext?: () => void;
}


export const TestPanel = forwardRef<TestPanelHandle, TestPanelProps>(function TestPanel(
  { projectId, designMd, components: _components = [], extractedFonts = [], initialResults = [], includeContext: includeContextProp, onToggleContext: onToggleContextProp },
  ref
) {
  const updateTestResults = useProjectStore((s) => s.updateTestResults);
  const [includeContextLocal, setIncludeContextLocal] = useState(true);
  const includeContext = includeContextProp ?? includeContextLocal;
  const toggleContext = onToggleContextProp ?? (() => setIncludeContextLocal((v) => !v));
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<TestResult[]>(initialResults);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [highlighted, setHighlighted] = useState(false);

  useImperativeHandle(ref, () => ({
    focusPrompt: () => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      textareaRef.current?.focus();
      setHighlighted(true);
      setTimeout(() => setHighlighted(false), 1500);
    },
  }));
  // Track latest results in a ref so we can persist after streaming without stale closures
  const resultsRef = useRef<TestResult[]>(initialResults);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || streamingId !== null) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const resultId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    const newResult: TestResult = {
      id: resultId,
      prompt: prompt.trim(),
      output: "",
      includeContext,
      createdAt: new Date().toISOString(),
    };

    setResults((prev) => [...prev, newResult]);
    setPrompt("");
    setStreamingId(resultId);

    try {
      const apiKey = getStoredApiKey();
      const res = await fetch("/api/generate/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-Api-Key": apiKey } : {}),
        },
        body: JSON.stringify({
          prompt: newResult.prompt,
          designMd,
          includeContext,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(friendlyError(errBody));
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let output = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output += decoder.decode(value, { stream: true });
        setResults((prev) => {
          const next = prev.map((r) => (r.id === resultId ? { ...r, output } : r));
          resultsRef.current = next;
          return next;
        });
      }

      // Calculate health score
      const healthScore = calculateHealthScore(output, extractedFonts, designMd);
      setResults((prev) => {
        const next = prev.map((r) => (r.id === resultId ? { ...r, healthScore } : r));
        resultsRef.current = next;
        return next;
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setResults((prev) => {
        const next = prev.map((r) =>
          r.id === resultId ? { ...r, output: `Error: ${message}` } : r
        );
        resultsRef.current = next;
        return next;
      });
    } finally {
      setStreamingId(null);
      // Persist after streaming ends — safe to call here (not during render)
      updateTestResults(projectId, resultsRef.current);
    }
  }, [prompt, streamingId, includeContext, designMd, extractedFonts, projectId, updateTestResults]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleRate = useCallback(
    (id: string, rating: "up" | "down") => {
      const updated = resultsRef.current.map((r) => (r.id === id ? { ...r, rating } : r));
      resultsRef.current = updated;
      setResults(updated);
      updateTestResults(projectId, updated);
    },
    [projectId, updateTestResults]
  );

  const handleRerun = useCallback(
    (result: TestResult) => {
      setPrompt(result.prompt);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    []
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updated = resultsRef.current.filter((r) => r.id !== id);
      resultsRef.current = updated;
      setResults(updated);
      updateTestResults(projectId, updated);
    },
    [projectId, updateTestResults]
  );

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [results]);

  return (
    <div className="flex h-full flex-col bg-[var(--bg-panel)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-4 py-2">
        <span className="text-xs font-medium text-[var(--text-primary)]">
          Test Panel
        </span>
        <button
          onClick={toggleContext}
          className="flex items-center gap-2"
          role="switch"
          aria-checked={includeContext}
        >
          <span className="text-xs text-[var(--text-secondary)]">
            DESIGN.md context
          </span>
          <span
            className={`relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full transition-colors ${
              includeContext ? "bg-emerald-500" : "bg-[#3a3a3f]"
            }`}
          >
            <span
              className={`inline-block h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${
                includeContext ? "translate-x-[16px]" : "translate-x-[2px]"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Output area */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {results.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <svg width="24" height="24" viewBox="0 0 18.5586 18.5586" fill="none" className="text-[var(--text-muted)]">
              <path d="M13.7168 0C16.3906 0 18.5586 2.16798 18.5586 4.8418V18.5586H0V0H13.7168ZM1.61426 16.9443H5.64844V12.9102H1.61426V16.9443ZM7.26172 12.9102V16.9443H16.9453V12.9102H7.26172ZM1.61426 11.2969H5.64844V1.61426H1.61426V11.2969Z" fill="currentColor" />
            </svg>
            <p className="text-center text-xs font-medium text-[var(--text-secondary)]">
              Test your DESIGN.md by asking Layout to
              <br />
              build components.
            </p>
            <p className="text-center text-xs text-[var(--text-muted)]">
              Toggle context ON/OFF to compare output quality.
            </p>
          </div>
        )}
        {results.map((result) => (
          <ResultBlock
            key={result.id}
            result={result}
            isStreaming={result.id === streamingId}
            onRate={handleRate}
            onRerun={handleRerun}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Input area */}
      <div className={`mx-3 mb-3 flex flex-col rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#161718] ${highlighted ? "ring-2 ring-[var(--studio-accent)] ring-offset-1 ring-offset-[var(--bg-panel)]" : ""}`}>
        {/* Text area */}
        <div className="relative p-2.5">
          <div className="flex min-h-[68px] items-start rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] px-3.5 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
            <input
              ref={textareaRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Layout to build a component..."
              className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[#898d94] outline-none"
            />
          </div>
          {/* Send button */}
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5">
            {prompt.trim() && (
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || streamingId !== null}
                className="flex items-center justify-center size-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-app)] transition-colors hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ArrowUp size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function extractFirstCodeBlock(text: string): { code: string; lang: string } | null {
  // Handle both \n and \r\n line endings from streaming responses
  const match = text.match(/```(\w*)\r?\n([\s\S]*?)```/);
  if (!match) return null;
  return { lang: match[1] || "tsx", code: match[2] };
}

function extractComponentName(code: string): string | null {
  // Prefer export default
  const exportDefault =
    code.match(/export\s+default\s+function\s+(\w+)/) ??
    code.match(/export\s+default\s+class\s+(\w+)/);
  if (exportDefault) return exportDefault[1];

  // Prefer a component named Demo, App, Page, Showcase, Example, Main, Preview
  const preferred = code.match(
    /(?:function|const|let|var)\s+((?:\w*(?:Demo|App|Page|Showcase|Example|Main|Preview))\w*)\s*[=(]/i
  );
  if (preferred) return preferred[1];

  // Fall back to the LAST component (demo wrappers are usually at the bottom)
  const all = [...code.matchAll(/(?:export\s+)?(?:function|const|let|var)\s+([A-Z]\w*)\s*[=(]/g)];
  return all.length > 0 ? all[all.length - 1][1] : null;
}

function buildPreviewHtml(js: string): string {
  // Safely embed CommonJS JS as a string literal — escape < and > to prevent HTML tag injection
  const jsStr = JSON.stringify(js)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <style>
    body { margin: 0; padding: 32px; font-family: sans-serif; background: #f4f4f5; background-image: radial-gradient(circle, #d4d4d8 1px, transparent 1px); background-size: 20px 20px; display: flex; align-items: flex-start; justify-content: center; min-height: 100vh; box-sizing: border-box; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    function showError(msg) {
      document.getElementById('root').innerHTML = '<pre style="color:red;font-size:11px;white-space:pre-wrap;padding:8px;margin:0">' + String(msg).replace(/</g,'&lt;') + '</pre>';
    }
    window.onerror = function(msg, src, line, col, err) {
      showError(err ? err.stack : msg);
      return true;
    };
    window.addEventListener('load', function() {
      try {
        var moduleCode = ${jsStr};
        var s = document.createElement('script');
        s.textContent = [
          'var _exp={};',
          'var require=function(id){return id==="react"?React:id==="react-dom"?ReactDOM:{};};',
          'var exports=_exp,module={exports:_exp};',
          moduleCode,
          '(function(){',
          '  var keys=Object.keys(_exp).filter(function(k){return k!=="__esModule";});',
          '  var comp=_exp["default"]||_exp[keys[0]];',
          '  if(!comp){showError("No component exported. Add export default to your Demo.");return;}',
          '  ReactDOM.render(React.createElement(comp),document.getElementById("root"));',
          '})();'
        ].join('\\n');
        document.body.appendChild(s);
      } catch(e) {
        showError(e.stack || e.message);
      }
    });
  </script>
</body>
</html>`;
}

function ComponentPreview({
  output,
  isStreaming,
  onFallbackToCode,
}: {
  output: string;
  isStreaming: boolean;
  onFallbackToCode?: () => void;
}) {
  // While streaming, show a stable placeholder — don't attempt transpilation
  const block = isStreaming ? null : extractFirstCodeBlock(output);
  const code = block
    ? block.code.replace(/^```\w*\r?\n?/gm, "").replace(/^```\s*$/gm, "").trim()
    : null;
  const componentName = code ? extractComponentName(code) : null;

  const [transpiledJs, setTranspiledJs] = useState<string | null>(null);
  const [transpileError, setTranspileError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!code || !componentName) return;
    let cancelled = false;
    setTranspiledJs(null);
    setTranspileError(null);

    fetch("/api/transpile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setTranspileError(data.error as string);
        else setTranspiledJs(data.js as string);
      })
      .catch((err) => {
        if (!cancelled) setTranspileError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [code, componentName]);

  const html = transpiledJs ? buildPreviewHtml(transpiledJs) : null;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    const onLoad = () => {
      try {
        const body = iframe.contentDocument?.body;
        if (body) iframe.style.height = body.scrollHeight + "px";
      } catch {
        // Cross-origin iframe — height auto-resize not possible
      }
    };
    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [html]);

  if (isStreaming) {
    return <p className="text-xs text-[var(--text-muted)]">Generating...</p>;
  }
  if (!block) {
    // Check if output contains an error message (e.g. missing API key)
    const trimmed = output.trim();
    const looksLikeError =
      trimmed.toLowerCase().includes("error") ||
      trimmed.toLowerCase().includes("api key") ||
      trimmed.toLowerCase().includes("unauthorized") ||
      trimmed.startsWith("{");

    return (
      <div className="space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          {looksLikeError ? trimmed : "No code block found in output."}
        </p>
        {onFallbackToCode && (
          <button
            onClick={onFallbackToCode}
            className="text-xs text-[var(--studio-accent)] hover:underline"
          >
            View raw output
          </button>
        )}
      </div>
    );
  }
  if (!componentName) {
    return (
      <p className="text-xs text-[var(--text-muted)]">
        Could not detect component name.
      </p>
    );
  }
  if (transpileError) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          Preview unavailable — the code could not be rendered.{" "}
          {onFallbackToCode && (
            <button
              onClick={onFallbackToCode}
              className="text-[var(--studio-accent)] hover:underline"
            >
              View code instead
            </button>
          )}
        </p>
      </div>
    );
  }
  if (!html) {
    return <p className="text-xs text-[var(--text-muted)]">Transpiling...</p>;
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      className="w-full rounded-md border border-[var(--studio-border)] bg-white"
      style={{ minHeight: 280 }}
      title="Component preview"
    />
  );
}

function ResultBlock({
  result,
  isStreaming,
  onRate,
  onRerun,
  onDelete,
}: {
  result: TestResult;
  isStreaming: boolean;
  onRate: (id: string, rating: "up" | "down") => void;
  onRerun: (result: TestResult) => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [figmaPushVariant, setFigmaPushVariant] = useState<DesignVariant | null>(null);
  const { pushComponent, pushing: pushingToDs, canPush } = usePushToDs();

  const handlePushToFigma = useCallback(() => {
    const block = extractFirstCodeBlock(result.output);
    if (!block) return;
    const code = block.code.replace(/^```\w*\r?\n?/gm, "").replace(/^```\s*$/gm, "").trim();
    const name = extractComponentName(code) ?? toFrameName(result.prompt);
    setFigmaPushVariant({
      id: result.id,
      name,
      rationale: result.prompt,
      code,
    });
  }, [result.output, result.prompt, result.id]);

  return (
    <div className="space-y-2">
      {/* Prompt */}
      <div className="flex items-start gap-2">
        <div className="rounded-md bg-[var(--studio-accent-subtle)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
          {result.prompt}
        </div>
      </div>

      {/* Preview / Code pill toggle */}
      {result.output && (
        <div className="flex gap-1">
          <button
            onClick={() => setTab("preview")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tab === "preview"
                ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                : "bg-[#28292a] text-[var(--text-primary)] hover:bg-[#333]"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setTab("code")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tab === "code"
                ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                : "bg-[#28292a] text-[var(--text-primary)] hover:bg-[#333]"
            }`}
          >
            Code
          </button>
        </div>
      )}

      {/* Output */}
      <div className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-3">
        {result.output && tab === "preview" ? (
          <ComponentPreview
            output={result.output}
            isStreaming={isStreaming}
            onFallbackToCode={() => setTab("code")}
          />
        ) : (
          <OutputRenderer text={result.output} />
        )}
      </div>

      {/* Health score */}
      {result.healthScore && <HealthScoreDisplay score={result.healthScore} />}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {result.output && (
          <>
            <button
              onClick={() => onRate(result.id, "up")}
              className={`rounded p-1 transition-colors ${
                result.rating === "up"
                  ? "text-emerald-400"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => onRate(result.id, "down")}
              className={`rounded p-1 transition-colors ${
                result.rating === "down"
                  ? "text-red-400"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => onRerun(result)}
              className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
              title="Re-run prompt"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            {extractFirstCodeBlock(result.output) && (
              <button
                onClick={handlePushToFigma}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                title="Push to Figma via MCP"
              >
                <Figma className="h-3 w-3" />
                <span>Push to Figma</span>
              </button>
            )}
            {canPush && extractFirstCodeBlock(result.output) && (
              <button
                onClick={() => {
                  const block = extractFirstCodeBlock(result.output);
                  if (!block) return;
                  const code = block.code.replace(/^```\w*\r?\n?/gm, "").replace(/^```\s*$/gm, "").trim();
                  const name = extractComponentName(code) ?? "Component";
                  pushComponent({
                    name,
                    code,
                    source: "extraction",
                    description: result.prompt,
                  });
                }}
                disabled={pushingToDs}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                  pushingToDs
                    ? "text-[var(--text-muted)] opacity-50"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
                title="Push to Design System"
              >
                <ArrowUpToLine className="h-3 w-3" />
                <span>Push to DS</span>
              </button>
            )}
          </>
        )}
        <button
          onClick={() => onDelete(result.id)}
          className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {figmaPushVariant && (
        <FigmaPushModal
          variant={figmaPushVariant}
          onClose={() => setFigmaPushVariant(null)}
        />
      )}
    </div>
  );
}

function OutputRenderer({ text }: { text: string }) {
  if (!text) {
    return (
      <span className="text-xs text-[var(--text-muted)]">Generating...</span>
    );
  }

  // Split on code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-[var(--text-secondary)]">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          return <CodeBlock key={i} content={part} />;
        }
        return (
          <div key={i} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      })}
    </div>
  );
}

function HealthScoreDisplay({ score }: { score: HealthScore }) {
  const colour =
    score.total >= 70
      ? "text-emerald-400"
      : score.total >= 40
        ? "text-yellow-400"
        : "text-red-400";

  const bgColour =
    score.total >= 70
      ? "bg-emerald-400/10"
      : score.total >= 40
        ? "bg-yellow-400/10"
        : "bg-red-400/10";

  return (
    <div className={`rounded-md ${bgColour} p-3`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Context Health
        </span>
        <span className={`text-sm font-bold ${colour}`}>
          {score.total}/100
        </span>
      </div>
      {score.issues.length > 0 && (
        <div className="mt-2 space-y-1">
          {score.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px]">
              <span
                className={
                  issue.severity === "error"
                    ? "text-red-400"
                    : "text-yellow-400"
                }
              >
                {issue.severity === "error" ? "✗" : "⚠"}
              </span>
              <span className="text-[var(--text-muted)]">
                {issue.rule}: {issue.actual}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const lines = content.split("\n");
  const lang = lines[0].replace("```", "").trim();
  const code = lines.slice(1, -1).join("\n");

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [code]);

  return (
    <div className="relative overflow-hidden rounded-md border border-[var(--studio-border)] bg-[var(--bg-app)]">
      <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-3 py-1">
        <span className="text-[10px] text-[var(--text-muted)]">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs">
        <code className="text-[var(--text-primary)]">{code}</code>
      </pre>
    </div>
  );
}
