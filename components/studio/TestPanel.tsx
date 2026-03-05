"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { calculateHealthScore } from "@/lib/health/score";
import type { TestResult, HealthScore } from "@/lib/types";

interface TestPanelProps {
  designMd: string;
  components?: string[];
  extractedFonts?: string[];
}

const QUICK_PROMPTS = [
  "Build me a primary button with hover state",
  "Build me a card component with title and description",
  "Build me a form input with label and error state",
  "Build me a navigation bar",
  "Build me a modal dialog",
];

export function TestPanel({ designMd, components = [], extractedFonts = [] }: TestPanelProps) {
  const [includeContext, setIncludeContext] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<TestResult[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const allPrompts = [
    ...QUICK_PROMPTS,
    ...components.map((c) => `Build me a ${c} component`),
  ];

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isStreaming) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const resultId = crypto.randomUUID();
    const newResult: TestResult = {
      id: resultId,
      prompt: prompt.trim(),
      output: "",
      includeContext,
      createdAt: new Date().toISOString(),
    };

    setResults((prev) => [...prev, newResult]);
    setPrompt("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/generate/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setResults((prev) =>
          prev.map((r) => (r.id === resultId ? { ...r, output } : r))
        );
      }

      // Calculate health score
      const healthScore = calculateHealthScore(output, extractedFonts);
      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId ? { ...r, healthScore } : r
        )
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId
            ? { ...r, output: `Error: ${message}` }
            : r
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [prompt, isStreaming, includeContext, designMd]);

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
      setResults((prev) =>
        prev.map((r) => (r.id === id ? { ...r, rating } : r))
      );
    },
    []
  );

  const handleRerun = useCallback(
    (result: TestResult) => {
      setPrompt(result.prompt);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    []
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
            onRate={handleRate}
            onRerun={handleRerun}
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
            disabled={!prompt.trim() || isStreaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[--studio-accent] text-[--text-on-accent] transition-colors hover:bg-[--studio-accent-hover] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultBlock({
  result,
  onRate,
  onRerun,
}: {
  result: TestResult;
  onRate: (id: string, rating: "up" | "down") => void;
  onRerun: (result: TestResult) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Prompt */}
      <div className="flex items-start gap-2">
        <div className="rounded-md bg-[--studio-accent-subtle] px-3 py-1.5 text-xs text-[--text-primary]">
          {result.prompt}
        </div>
      </div>

      {/* Output */}
      <div className="rounded-md border border-[--studio-border] bg-[--bg-surface] p-3">
        <OutputRenderer text={result.output} />
      </div>

      {/* Health score */}
      {result.healthScore && <HealthScoreDisplay score={result.healthScore} />}

      {/* Actions */}
      {result.output && (
        <div className="flex items-center gap-2">
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
        </div>
      )}
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
