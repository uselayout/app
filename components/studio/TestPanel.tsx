"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { calculateHealthScore } from "@/lib/health/score";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { useProjectStore } from "@/lib/store/project";
import type { TestResult, HealthScore } from "@/lib/types";

export interface TestPanelHandle {
  focusPrompt: () => void;
}

interface TestPanelProps {
  projectId: string;
  designMd: string;
  components?: string[];
  extractedFonts?: string[];
  initialResults?: TestResult[];
}

const QUICK_PROMPTS = [
  "Build me a primary button with hover state",
  "Build me a card component with title and description",
  "Build me a form input with label and error state",
  "Build me a navigation bar",
  "Build me a modal dialog",
];

export const TestPanel = forwardRef<TestPanelHandle, TestPanelProps>(function TestPanel(
  { projectId, designMd, components = [], extractedFonts = [], initialResults = [] },
  ref
) {
  const updateTestResults = useProjectStore((s) => s.updateTestResults);
  const [includeContext, setIncludeContext] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<TestResult[]>(initialResults);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useImperativeHandle(ref, () => ({
    focusPrompt: () => {
      textareaRef.current?.focus();
    },
  }));
  // Track latest results in a ref so we can persist after streaming without stale closures
  const resultsRef = useRef<TestResult[]>(initialResults);

  const allPrompts = [
    ...QUICK_PROMPTS,
    ...components.map((c) => `Build me a ${c} component`),
  ];

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
        throw new Error(`Test failed: ${res.status}`);
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
      if (e.key === "Enter" && !e.shiftKey) {
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
    <div className="flex h-full flex-col bg-[--bg-panel]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--studio-border] px-4 py-2">
        <span className="text-xs font-medium text-[--text-primary]">
          Test Panel
        </span>
        <button
          onClick={() => setIncludeContext(!includeContext)}
          className="flex items-center gap-2"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              includeContext ? "bg-emerald-400" : "bg-orange-400"
            }`}
          />
          <span className="text-xs text-[--text-secondary]">
            {includeContext ? "DESIGN.md context: ON" : "Bare Claude"}
          </span>
        </button>
      </div>

      {/* Output area */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {results.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-xs text-[--text-muted]">
              Test your DESIGN.md by asking Claude to build components.
              <br />
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
      <div className="border-t border-[--studio-border] p-3">
        {/* Quick prompts */}
        <div className="relative mb-2">
          <button
            onClick={() => setShowQuickPrompts(!showQuickPrompts)}
            className="flex items-center gap-1 text-xs text-[--text-muted] hover:text-[--text-secondary]"
          >
            Quick prompts
            <ChevronDown className="h-3 w-3" />
          </button>
          {showQuickPrompts && (
            <div className="absolute bottom-full left-0 z-10 mb-1 w-full rounded-md border border-[--studio-border] bg-[--bg-elevated] py-1 shadow-lg">
              {allPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPrompt(p);
                    setShowQuickPrompts(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary]"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claude to build a component..."
            rows={2}
            className="flex-1 resize-none rounded-md border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--studio-border-focus] focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || streamingId !== null}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[--studio-accent] text-[--text-on-accent] transition-colors hover:bg-[--studio-accent-hover] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
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
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
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
  <\/script>
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
      } catch {}
    };
    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [html]);

  if (isStreaming) {
    return <p className="text-xs text-[--text-muted]">Generating...</p>;
  }
  if (!block) {
    return <p className="text-xs text-[--text-muted]">No code block found in output.</p>;
  }
  if (!componentName) {
    return (
      <p className="text-xs text-[--text-muted]">
        Could not detect component name.
      </p>
    );
  }
  if (transpileError) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-[--text-muted]">
          Preview unavailable — the code could not be rendered.{" "}
          {onFallbackToCode && (
            <button
              onClick={onFallbackToCode}
              className="text-[--studio-accent] hover:underline"
            >
              View code instead
            </button>
          )}
        </p>
      </div>
    );
  }
  if (!html) {
    return <p className="text-xs text-[--text-muted]">Transpiling...</p>;
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      className="w-full rounded-md border border-[--studio-border] bg-white"
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

  return (
    <div className="space-y-2">
      {/* Prompt */}
      <div className="flex items-start gap-2">
        <div className="rounded-md bg-[--studio-accent-subtle] px-3 py-1.5 text-xs text-[--text-primary]">
          {result.prompt}
        </div>
      </div>

      {/* Tab bar */}
      {result.output && (
        <div className="flex gap-1 border-b border-[--studio-border]">
          <button
            onClick={() => setTab("preview")}
            className={`px-3 py-1 text-xs transition-colors ${
              tab === "preview"
                ? "border-b-2 border-[--studio-accent] text-[--text-primary]"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setTab("code")}
            className={`px-3 py-1 text-xs transition-colors ${
              tab === "code"
                ? "border-b-2 border-[--studio-accent] text-[--text-primary]"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            Code
          </button>
        </div>
      )}

      {/* Output */}
      <div className="rounded-md border border-[--studio-border] bg-[--bg-surface] p-3">
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
                  : "text-[--text-muted] hover:text-[--text-secondary]"
              }`}
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => onRate(result.id, "down")}
              className={`rounded p-1 transition-colors ${
                result.rating === "down"
                  ? "text-red-400"
                  : "text-[--text-muted] hover:text-[--text-secondary]"
              }`}
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => onRerun(result)}
              className="rounded p-1 text-[--text-muted] transition-colors hover:text-[--text-secondary]"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </>
        )}
        <button
          onClick={() => onDelete(result.id)}
          className="rounded p-1 text-[--text-muted] transition-colors hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function OutputRenderer({ text }: { text: string }) {
  if (!text) {
    return (
      <span className="text-xs text-[--text-muted]">Generating...</span>
    );
  }

  // Split on code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-[--text-secondary]">
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
        <span className="text-xs font-medium text-[--text-secondary]">
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
              <span className="text-[--text-muted]">
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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  return (
    <div className="relative overflow-hidden rounded-md border border-[--studio-border] bg-[--bg-app]">
      <div className="flex items-center justify-between border-b border-[--studio-border] px-3 py-1">
        <span className="text-[10px] text-[--text-muted]">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="text-[--text-muted] transition-colors hover:text-[--text-secondary]"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs">
        <code className="text-[--text-primary]">{code}</code>
      </pre>
    </div>
  );
}
