"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, ShieldCheck, XCircle } from "lucide-react";

interface ComplianceFinding {
  ruleId: string;
  ruleName: string;
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
}

interface ComplianceResponse {
  score: number;
  passed: boolean;
  summary: string;
  findings: ComplianceFinding[];
}

function SeverityIcon({ severity }: { severity: ComplianceFinding["severity"] }) {
  if (severity === "error") {
    return <XCircle className="h-3 w-3 shrink-0 text-[var(--status-error)]" />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="h-3 w-3 shrink-0 text-[var(--status-warning)]" />;
  }
  return <Info className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />;
}

/**
 * "Check code" section for the Quality tab: paste a snippet, run the same
 * compliance rules the CLI's check-compliance MCP tool uses, and see
 * rule-level findings against this project's tokens and components.
 */
export function ComplianceCheckPanel({ projectId }: { projectId: string }) {
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = useCallback(async () => {
    if (!code.trim()) return;
    setIsChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, projectId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Compliance check failed");
        setResult(null);
        return;
      }
      setResult((await res.json()) as ComplianceResponse);
    } catch {
      setError("Compliance check failed");
      setResult(null);
    } finally {
      setIsChecking(false);
    }
  }, [code, projectId]);

  return (
    <div className="border-t border-[var(--studio-border)] p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
        <h3 className="text-xs font-semibold text-[var(--text-primary)]">Check code</h3>
      </div>
      <p className="text-[10px] leading-[16px] text-[var(--text-muted)]">
        Paste UI code to validate it against this design system. Runs the same
        rules as the CLI&apos;s check-compliance tool.
      </p>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={'<button style={{ background: "#ff0000" }}>…</button>'}
        rows={6}
        spellCheck={false}
        className="w-full resize-y rounded-lg border border-[var(--studio-border)] bg-[var(--bg-app)] px-3 py-2 font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
      />
      <button
        onClick={handleCheck}
        disabled={isChecking || !code.trim()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-3 py-2 text-xs font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-30"
      >
        {isChecking ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking…
          </>
        ) : (
          "Check compliance"
        )}
      </button>

      {error && (
        <p className="text-[11px] text-[var(--status-error)]">{error}</p>
      )}

      {result && (
        <div className="space-y-2 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-secondary)]">Compliance score</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                result.score >= 80
                  ? "bg-[var(--status-success)]/20 text-[var(--status-success)]"
                  : result.score >= 50
                    ? "bg-[var(--status-warning)]/20 text-[var(--status-warning)]"
                    : "bg-[var(--status-error)]/20 text-[var(--status-error)]"
              }`}
            >
              {result.score}/100
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">{result.summary}</p>

          {result.findings.length === 0 ? (
            <div className="flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-success)]" />
              <span className="text-[11px] text-[var(--text-secondary)]">
                No compliance issues found
              </span>
            </div>
          ) : (
            <ul className="space-y-1.5 pt-1">
              {result.findings.map((finding, i) => (
                <li key={`${finding.ruleId}-${i}`} className="flex items-start gap-1.5">
                  <span className="mt-0.5">
                    <SeverityIcon severity={finding.severity} />
                  </span>
                  <span className="text-[10px] leading-[15px] text-[var(--text-secondary)]">
                    <span className="font-mono text-[var(--text-primary)]">{finding.ruleId}</span>
                    {finding.line != null && (
                      <span className="text-[var(--text-muted)]"> (line {finding.line})</span>
                    )}
                    : {finding.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
