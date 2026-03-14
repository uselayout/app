"use client";

import { useState, useEffect, useMemo } from "react";
import { useOrgStore } from "@/lib/store/organization";
import type { AnalyticsSummary } from "@/lib/types/analytics";

const TIME_RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
] as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5"
    >
      <p className="text-3xl font-semibold text-[var(--text-primary)]">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function RankedList({
  title,
  items,
  labelKey,
  countKey,
}: {
  title: string;
  items: Array<Record<string, unknown>>;
  labelKey: string;
  countKey: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
      <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No data yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li
              key={String(item[labelKey])}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-[var(--text-primary)]">
                <span className="w-5 text-right text-[var(--text-muted)]">
                  {i + 1}
                </span>
                {String(item[labelKey])}
              </span>
              <span className="font-mono text-[var(--text-muted)]">
                {Number(item[countKey]).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityChart({ dailyCounts }: { dailyCounts: Array<{ date: string; count: number }> }) {
  const maxCount = useMemo(
    () => Math.max(...dailyCounts.map((d) => d.count), 1),
    [dailyCounts]
  );

  if (dailyCounts.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
      <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">
        Activity
      </h3>
      <div className="flex items-end gap-1 overflow-x-auto pb-1">
        {dailyCounts.map((day) => {
          const height = Math.max((day.count / maxCount) * 120, 2);
          return (
            <div
              key={day.date}
              className="flex min-w-[20px] flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {day.count}
              </span>
              <div
                className="w-full rounded-t bg-[var(--studio-accent)]"
                style={{ height: `${height}px` }}
              />
              <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                {formatDate(day.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const orgId = useOrgStore((s) => s.currentOrgId);
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orgId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/analytics?days=${days}`
        );
        if (!cancelled && res.ok) {
          const data: AnalyticsSummary = await res.json();
          setSummary(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orgId, days]);

  if (!orgId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">
          Loading organisation...
        </p>
      </div>
    );
  }

  const isEmpty =
    summary &&
    summary.totalMcpCalls === 0 &&
    summary.totalComponentViews === 0 &&
    summary.totalTokenExports === 0 &&
    summary.dailyCounts.length === 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Analytics
        </h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] ease-[var(--ease-out)] focus:border-[var(--studio-border-focus)]"
        >
          {TIME_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      ) : isEmpty ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="max-w-md text-center text-sm text-[var(--text-muted)]">
            No analytics data yet. Analytics events are recorded automatically
            as your team uses the design system.
          </p>
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="MCP API Calls" value={summary.totalMcpCalls} />
            <StatCard
              label="Component Views"
              value={summary.totalComponentViews}
            />
            <StatCard
              label="Token Exports"
              value={summary.totalTokenExports}
            />
          </div>

          {/* Two-column ranked lists */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RankedList
              title="Top Components"
              items={summary.topComponents}
              labelKey="name"
              countKey="count"
            />
            <RankedList
              title="Top MCP Tools"
              items={summary.topMcpTools}
              labelKey="tool"
              countKey="count"
            />
          </div>

          {/* Activity chart */}
          <ActivityChart dailyCounts={summary.dailyCounts} />
        </div>
      ) : null}
    </div>
  );
}
