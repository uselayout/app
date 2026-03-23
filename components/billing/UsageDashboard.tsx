"use client";

import { useEffect, useState } from "react";
import { useBilling } from "@/lib/hooks/use-billing";
import type { UsageLogEntry, UsageStats } from "@/lib/types/billing";
import { FileText, MessageSquare, Coins, TrendingUp } from "lucide-react";

function CreditGauge({
  label,
  used,
  total,
  icon: Icon,
}: {
  label: string;
  used: number;
  total: number;
  icon: typeof FileText;
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = Math.max(total - used, 0);

  return (
    <div className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--studio-accent)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      </div>
      <div className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
        {remaining}
        <span className="text-sm font-normal text-[var(--text-muted)]"> / {total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--bg-hover)]">
        <div
          className="h-full rounded-full bg-[var(--studio-accent)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsageDashboard() {
  const { tier, credits } = useBilling();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [history, setHistory] = useState<UsageLogEntry[]>([]);

  useEffect(() => {
    void fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setHistory(data.history ?? []);
      })
      .catch(() => {});
  }, []);

  const totalLayoutMd = tier === "pro" || tier === "team" ? 50 : 0;
  const totalAiQuery = tier === "pro" || tier === "team" ? 100 : 0;
  const usedLayoutMd = totalLayoutMd - (credits?.layoutMdRemaining ?? 0);
  const usedAiQuery = totalAiQuery - (credits?.aiQueryRemaining ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Usage</h3>
        <span className="rounded-md bg-[var(--studio-accent-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--studio-accent)]">
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </span>
      </div>

      {(tier === "pro" || tier === "team") && (
        <div className="grid grid-cols-2 gap-4">
          <CreditGauge
            label="layout.md generations"
            used={Math.max(usedLayoutMd, 0)}
            total={totalLayoutMd + (credits?.topupLayoutMd ?? 0)}
            icon={FileText}
          />
          <CreditGauge
            label="AI queries"
            used={Math.max(usedAiQuery, 0)}
            total={totalAiQuery + (credits?.topupAiQuery ?? 0)}
            icon={MessageSquare}
          />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-secondary)]">Total tokens</span>
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              {((stats.totalInputTokens + stats.totalOutputTokens) / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
            <div className="mb-1 flex items-center gap-2">
              <Coins className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-secondary)]">Est. cost</span>
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              ${stats.totalCostUsd.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">Recent activity</h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {history.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    entry.mode === "hosted"
                      ? "bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  }`}>
                    {entry.mode}
                  </span>
                  <span className="text-[var(--text-primary)]">
                    {entry.endpoint === "layout-md" ? "layout.md" : "AI query"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                  <span>{((entry.inputTokens + entry.outputTokens) / 1000).toFixed(1)}k tok</span>
                  <span>${entry.costEstimateUsd.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
