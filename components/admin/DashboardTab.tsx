"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OverviewData {
  totalUsers: number;
  activeUsers7d: number;
  newUsersPeriod: number;
  totalProjects: number;
  layoutMdsCreated: number;
  variantsGenerated: number;
  componentsSaved: number;
  bundleExports: number;
  layoutMdsThisMonth?: number;
  variantsThisMonth?: number;
  errorsLast24h: number;
}

interface DailyUsage {
  date: string;
  layoutMds: number;
  variants: number;
  edits: number;
  extractions: number;
  exports: number;
  mcpCalls: number;
}

interface UsageData {
  daily: DailyUsage[];
  totals: {
    layoutMds: number;
    variants: number;
    edits: number;
    extractions: number;
    exports: number;
    mcpCalls: number;
  };
}

interface ErrorEntry {
  timestamp: string;
  endpoint: string;
  status: number;
  message: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorsData {
  errors: ErrorEntry[];
  countByEndpoint: Record<string, number>;
}

interface FunnelStage {
  stage: string;
  count: number;
  conversion?: number;
}

interface UserRow {
  email: string;
  projects: number;
  layoutMds: number;
  variants: number;
  cost: number;
  lastActive: string;
  tier: string;
  mode: string;
  hasFigma: boolean;
}

interface UsersData {
  users: UserRow[];
}

interface ProductData {
  studio: {
    activeUsers7d: number;
    projectsCreated: number;
    layoutMdsGenerated: number;
    variantsGenerated: number;
    sourceTypes: Record<string, number>;
    byokVsHosted: { byok: number; hosted: number };
    modelUsage: Record<string, number>;
    componentTypes: { component: number; page: number };
    componentSources: Record<string, number>;
  };
  cli: {
    activeInstalls: number;
    mcpCallsToday: number;
    topTools: Array<{ tool: string; count: number }>;
    exports: number;
  };
  figmaPlugin: {
    activeUsers: number;
    syncs: number;
    pushes: number;
  };
  chromeExtension: {
    activeUsers: number;
    extractions: number;
  };
  billing: {
    usersAtZeroCredits: number;
    zeroCreditsEmails: string[];
    topConsumers: Array<{ email: string; cost: number }>;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatRelativeTimestamp(iso: string): string {
  try {
    return formatRelativeTime(new Date(iso));
  } catch {
    return iso;
  }
}

function formatNumber(n: number | undefined | null): string {
  if (n == null) return "0";
  return n.toLocaleString("en-GB");
}

function formatCurrency(n: number | undefined | null): string {
  if (n == null) return "£0.00";
  return `£${n.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  warning?: boolean;
}

function StatCard({ label, value, subValue, warning }: StatCardProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${warning ? "rgba(245,158,11,0.5)" : "var(--studio-border)"}`,
      }}
    >
      <div
        className="text-xs uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-semibold mt-1"
        style={{ color: warning ? "#f59e0b" : "var(--text-primary)" }}
      >
        {value}
      </div>
      {subValue && (
        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mt-8 mb-4">
      <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Usage Chart
// ---------------------------------------------------------------------------

const CHART_SEGMENTS = [
  { key: "layoutMds" as keyof DailyUsage, label: "Layout.mds", color: "#3b82f6" },
  { key: "variants" as keyof DailyUsage, label: "Variants", color: "#8b5cf6" },
  { key: "edits" as keyof DailyUsage, label: "Edits", color: "#10b981" },
  { key: "extractions" as keyof DailyUsage, label: "Extractions", color: "#f59e0b" },
  { key: "exports" as keyof DailyUsage, label: "Exports", color: "#06b6d4" },
  { key: "mcpCalls" as keyof DailyUsage, label: "MCP Calls", color: "#ec4899" },
] as const;

function UsageChart({ daily }: { daily: DailyUsage[] }) {
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);

  if (!daily.length) {
    return (
      <div
        className="h-40 rounded-lg flex items-center justify-center text-xs"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)", color: "var(--text-muted)" }}
      >
        No usage data
      </div>
    );
  }

  const maxTotal = Math.max(
    ...daily.map((d) =>
      CHART_SEGMENTS.reduce((sum, seg) => sum + (d[seg.key] as number), 0)
    ),
    1
  );

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
    >
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 justify-end">
        {CHART_SEGMENTS.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: seg.color }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {seg.label}
            </span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="relative">
        <div className="flex items-end gap-px h-40">
          {daily.map((day, i) => {
            const total = CHART_SEGMENTS.reduce((sum, seg) => sum + (day[seg.key] as number), 0);
            const heightPct = (total / maxTotal) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col-reverse cursor-pointer relative"
                style={{ height: "100%" }}
                onMouseEnter={(e) => setTooltip({ index: i, x: e.currentTarget.getBoundingClientRect().left, y: e.currentTarget.getBoundingClientRect().top })}
                onMouseLeave={() => setTooltip(null)}
              >
                <div
                  className="flex flex-col-reverse w-full"
                  style={{ height: `${heightPct}%` }}
                >
                  {CHART_SEGMENTS.map((seg) => {
                    const val = day[seg.key] as number;
                    if (!val) return null;
                    const segPct = (val / total) * 100;
                    return (
                      <div
                        key={seg.key}
                        style={{ height: `${segPct}%`, background: seg.color, minHeight: val > 0 ? "1px" : undefined }}
                      />
                    );
                  })}
                </div>
                {/* Tooltip */}
                {tooltip?.index === i && (
                  <div
                    className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20 rounded-md px-2 py-1.5 text-xs whitespace-nowrap pointer-events-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--studio-border-strong)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <div className="font-medium mb-1">{day.date}</div>
                    {CHART_SEGMENTS.map((seg) => {
                      const val = day[seg.key] as number;
                      if (!val) return null;
                      return (
                        <div key={seg.key} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-sm" style={{ background: seg.color }} />
                          <span style={{ color: "var(--text-secondary)" }}>{seg.label}:</span>
                          <span>{val}</span>
                        </div>
                      );
                    })}
                    <div className="mt-1 pt-1" style={{ borderTop: "1px solid var(--studio-border)" }}>
                      Total: {total}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-px mt-1">
          {daily.map((day, i) => (
            <div key={day.date} className="flex-1 text-center">
              {i % 5 === 0 && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {day.date.slice(5)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Breakdown bar
// ---------------------------------------------------------------------------

interface BreakdownItem {
  label: string;
  count: number;
  percent: number;
  color?: string;
}

function BreakdownCard({ title, items }: { title: string; items: BreakdownItem[] }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
    >
      <div className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
        {title}
      </div>
      {items.length === 0 && (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>No data</div>
      )}
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between mb-2 last:mb-0">
          <span className="text-xs truncate mr-2 flex-shrink-0 max-w-[7rem]" style={{ color: "var(--text-secondary)" }}>
            {item.label}
          </span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div
              className="w-24 h-1.5 rounded-full overflow-hidden flex-shrink-0"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.percent}%`,
                  background: item.color ?? "var(--studio-accent)",
                }}
              />
            </div>
            <span className="text-xs w-8 text-right tabular-nums" style={{ color: "var(--text-muted)" }}>
              {item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PillSplit({ a, b }: { a: { label: string; count: number; color: string }; b: { label: string; count: number; color: string } }) {
  const total = (a.count + b.count) || 1;
  const aPct = Math.round((a.count / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex h-5 rounded-full overflow-hidden">
        <div style={{ width: `${aPct}%`, background: a.color }} className="transition-all" />
        <div style={{ width: `${100 - aPct}%`, background: b.color }} className="transition-all" />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
        <span>
          <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: a.color }} />
          {a.label} ({a.count})
        </span>
        <span>
          {b.label} ({b.count})
          <span className="inline-block w-2 h-2 rounded-sm ml-1" style={{ background: b.color }} />
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardTab({ onSwitchTab }: { onSwitchTab?: (tab: string) => void }) {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [errors, setErrors] = useState<ErrorsData | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[] | null>(null);
  const [users, setUsers] = useState<UsersData | null>(null);
  const [products, setProducts] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Sort state for top users table
  const [sortKey, setSortKey] = useState<keyof UserRow>("cost");
  const [sortAsc, setSortAsc] = useState(false);

  // Expanded error rows
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  // Time range filter
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d" | "90d">("30d");

  // Error endpoint filter
  const [endpointFilter, setEndpointFilter] = useState<string>("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const days = timeRange === "today" ? 1 : timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
    const errorHours = timeRange === "today" ? 24 : days * 24;
    try {
      const [ov, us, er, fu, usr, pr] = await Promise.all([
        fetch(`/api/admin/dashboard/overview?days=${days}`).then((r) => r.json()),
        fetch(`/api/admin/dashboard/usage?days=${days}`).then((r) => r.json()),
        fetch(`/api/admin/dashboard/errors?hours=${errorHours}`).then((r) => r.json()),
        fetch("/api/admin/dashboard/funnel").then((r) => r.json()),
        fetch(`/api/admin/dashboard/users?sort=cost&limit=20&days=${days}`).then((r) => r.json()),
        fetch("/api/admin/dashboard/products").then((r) => r.json()),
      ]);
      setOverview(ov);
      setUsage(us);
      setErrors(er);
      setFunnel(fu.funnel);
      setUsers(usr);
      setProducts(pr);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const sortedUsers = users?.users
    ? [...users.users].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") {
          return sortAsc ? av - bv : bv - av;
        }
        const as = String(av ?? "");
        const bs = String(bv ?? "");
        return sortAsc ? as.localeCompare(bs) : bs.localeCompare(as);
      })
    : [];

  const toggleSort = (key: keyof UserRow) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filteredErrors = errors?.errors
    ? (endpointFilter === "all"
        ? errors.errors
        : errors.errors.filter((e) => e.endpoint === endpointFilter)
      ).slice(0, 50)
    : [];

  // Feature adoption breakdown helpers
  const toBreakdownItems = (
    record: Record<string, number> | undefined,
    color?: string
  ): BreakdownItem[] => {
    if (!record) return [];
    const total = Object.values(record).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(record)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.round((count / total) * 100),
        color,
      }));
  };

  const toRankedItems = (arr: Array<{ tool: string; count: number }> | undefined): BreakdownItem[] => {
    if (!arr?.length) return [];
    const max = arr[0]?.count || 1;
    return arr.map(({ tool, count }) => ({
      label: tool,
      count,
      percent: Math.round((count / max) * 100),
    }));
  };

  const toModelItems = (record: Record<string, number> | undefined): BreakdownItem[] => {
    if (!record) return [];
    const entries = Object.entries(record).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] || 1;
    return entries.map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / max) * 100),
    }));
  };

  const maxFunnelCount = funnel ? Math.max(...funnel.map((s) => s.count), 1) : 1;

  // Top consumers chart
  const topConsumers = products?.billing?.topConsumers ?? [];
  const maxConsumerCost = topConsumers[0]?.cost || 1;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Platform Dashboard
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Last updated: {lastRefreshed ? formatRelativeTime(lastRefreshed) : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-md overflow-hidden"
            style={{ border: "1px solid var(--studio-border)" }}
          >
            {(["today", "7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-2.5 py-1 text-xs transition-all"
                style={{
                  background: timeRange === range ? "var(--bg-hover)" : "var(--bg-elevated)",
                  color: timeRange === range ? "var(--text-primary)" : "var(--text-muted)",
                  borderRight: range !== "90d" ? "1px solid var(--studio-border)" : "none",
                  transition: "all var(--duration-base) var(--ease-out)",
                }}
              >
                {range === "today" ? "Today" : range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded-md transition-all"
            style={{
              border: "1px solid var(--studio-border)",
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              transition: "all var(--duration-base) var(--ease-out)",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && !overview && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-lg animate-pulse"
              style={{ background: "var(--bg-surface)" }}
            />
          ))}
        </div>
      )}

      {/* A. Headline Metrics */}
      {(overview || !loading) && (
        <>
          <SectionHeader title="Headline Metrics" />
          <div className="grid grid-cols-4 gap-3 mb-3">
            <StatCard
              label="Total Users"
              value={formatNumber(overview?.totalUsers)}
            />
            <StatCard
              label={`Active Users (${timeRange === "today" ? "today" : timeRange})`}
              value={formatNumber(overview?.activeUsers7d)}
              subValue={timeRange === "today" ? "today" : timeRange === "7d" ? "this week" : timeRange === "90d" ? "this quarter" : "this month"}
            />
            <StatCard
              label="New Users"
              value={formatNumber(overview?.newUsersPeriod)}
              subValue={timeRange === "today" ? "today" : timeRange === "7d" ? "last 7 days" : timeRange === "90d" ? "last 90 days" : "last 30 days"}
            />
            <StatCard
              label="Total Projects"
              value={formatNumber(overview?.totalProjects)}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="Layout.mds Created"
              value={formatNumber(overview?.layoutMdsCreated)}
              subValue={overview?.layoutMdsThisMonth != null ? `${formatNumber(overview.layoutMdsThisMonth)} ${timeRange === "today" ? "today" : timeRange === "7d" ? "this week" : timeRange === "90d" ? "this quarter" : "this month"}` : undefined}
            />
            <StatCard
              label="Variants Generated"
              value={formatNumber(overview?.variantsGenerated)}
              subValue={overview?.variantsThisMonth != null ? `${formatNumber(overview.variantsThisMonth)} ${timeRange === "today" ? "today" : timeRange === "7d" ? "this week" : timeRange === "90d" ? "this quarter" : "this month"}` : undefined}
            />
            <StatCard
              label="Components Saved"
              value={formatNumber(overview?.componentsSaved)}
            />
            <StatCard
              label="Bundle Exports"
              value={formatNumber(overview?.bundleExports)}
              warning={(overview?.errorsLast24h ?? 0) > 0}
              subValue={
                (overview?.errorsLast24h ?? 0) > 0
                  ? `${overview!.errorsLast24h} errors in last 24h`
                  : undefined
              }
            />
          </div>
        </>
      )}

      {/* B. Product Breakdown */}
      <SectionHeader title="Product Breakdown" />
      <div className="grid grid-cols-4 gap-3">
        {/* Studio */}
        <div
          className="rounded-lg p-4 border-t-2"
          style={{
            background: "var(--bg-surface)",
            borderColor: "#3b82f6",
            borderLeft: "1px solid var(--studio-border)",
            borderRight: "1px solid var(--studio-border)",
            borderBottom: "1px solid var(--studio-border)",
          }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: "#3b82f6" }}>Studio</div>
          {[
            { label: "Active (7d)", value: formatNumber(products?.studio?.activeUsers7d) },
            { label: "Projects created", value: formatNumber(products?.studio?.projectsCreated) },
            { label: "Layout.mds", value: formatNumber(products?.studio?.layoutMdsGenerated) },
            { label: "Variants", value: formatNumber(products?.studio?.variantsGenerated) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center mb-1.5 last:mb-0">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="text-xs font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* CLI/MCP */}
        <div
          className="rounded-lg p-4 border-t-2"
          style={{
            background: "var(--bg-surface)",
            borderColor: "#10b981",
            borderLeft: "1px solid var(--studio-border)",
            borderRight: "1px solid var(--studio-border)",
            borderBottom: "1px solid var(--studio-border)",
          }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: "#10b981" }}>CLI / MCP</div>
          {[
            { label: "Active installs", value: formatNumber(products?.cli?.activeInstalls) },
            { label: "MCP calls today", value: formatNumber(products?.cli?.mcpCallsToday) },
            { label: "Exports", value: formatNumber(products?.cli?.exports) },
            { label: "Top tool", value: products?.cli?.topTools?.[0]?.tool ?? "-" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center mb-1.5 last:mb-0">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="text-xs font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Figma Plugin */}
        <div
          className="rounded-lg p-4 border-t-2"
          style={{
            background: "var(--bg-surface)",
            borderColor: "#8b5cf6",
            borderLeft: "1px solid var(--studio-border)",
            borderRight: "1px solid var(--studio-border)",
            borderBottom: "1px solid var(--studio-border)",
          }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: "#8b5cf6" }}>Figma Plugin</div>
          {[
            { label: "Active users", value: formatNumber(products?.figmaPlugin?.activeUsers) },
            { label: "Syncs", value: formatNumber(products?.figmaPlugin?.syncs) },
            { label: "Pushes to Figma", value: formatNumber(products?.figmaPlugin?.pushes) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center mb-1.5 last:mb-0">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="text-xs font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Chrome Extension */}
        <div
          className="rounded-lg p-4 border-t-2"
          style={{
            background: "var(--bg-surface)",
            borderColor: "#f97316",
            borderLeft: "1px solid var(--studio-border)",
            borderRight: "1px solid var(--studio-border)",
            borderBottom: "1px solid var(--studio-border)",
          }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: "#f97316" }}>Chrome Extension</div>
          {[
            { label: "Active users", value: formatNumber(products?.chromeExtension?.activeUsers) },
            { label: "Extractions", value: formatNumber(products?.chromeExtension?.extractions) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center mb-1.5 last:mb-0">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="text-xs font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* C. Usage Chart */}
      <SectionHeader title="Activity (last 30 days)" />
      {usage?.daily ? (
        <UsageChart daily={usage.daily} />
      ) : (
        <div
          className="h-52 rounded-lg animate-pulse"
          style={{ background: "var(--bg-surface)" }}
        />
      )}

      {/* D. Feature Adoption */}
      <SectionHeader title="Feature Adoption" />
      <div className="grid grid-cols-3 gap-3">
        {/* Source types */}
        <BreakdownCard
          title="Source Type"
          items={toBreakdownItems(products?.studio?.sourceTypes, "#3b82f6")}
        />

        {/* BYOK vs Hosted */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            API Key Mode (users)
          </div>
          <PillSplit
            a={{ label: "BYOK", count: products?.studio?.byokVsHosted?.byok ?? 0, color: "#8b5cf6" }}
            b={{ label: "Hosted", count: products?.studio?.byokVsHosted?.hosted ?? 0, color: "#3b82f6" }}
          />
        </div>

        {/* Model usage */}
        <BreakdownCard
          title="Model Usage (users)"
          items={toModelItems(products?.studio?.modelUsage)}
        />

        {/* Top MCP tools */}
        <BreakdownCard
          title="Top MCP Tools"
          items={toRankedItems(products?.cli?.topTools)}
        />

        {/* Component types */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            Saved Component Types
          </div>
          <PillSplit
            a={{ label: "Component", count: products?.studio?.componentTypes?.component ?? 0, color: "#06b6d4" }}
            b={{ label: "Page", count: products?.studio?.componentTypes?.page ?? 0, color: "#f59e0b" }}
          />
        </div>

        {/* Component sources */}
        <BreakdownCard
          title="Component Sources"
          items={toBreakdownItems(products?.studio?.componentSources, "#10b981")}
        />
      </div>

      {/* E. Growth Funnel */}
      <SectionHeader title="Growth Funnel" />
      <div
        className="rounded-lg p-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
      >
        {funnel?.length ? (
          <div className="space-y-1.5">
            {funnel.map((stage, i) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span
                  className="text-xs text-right flex-shrink-0 w-44"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {stage.stage}
                </span>
                <div
                  className="flex-1 h-6 rounded overflow-hidden"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${(stage.count / maxFunnelCount) * 100}%`,
                      background: `rgba(224,224,230,${0.15 + (i / (funnel.length || 1)) * 0.6})`,
                    }}
                  />
                </div>
                <span
                  className="text-xs font-mono text-right w-12 flex-shrink-0 tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatNumber(stage.count)}
                </span>
                {stage.conversion !== undefined && (
                  <span
                    className="text-xs w-12 flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {stage.conversion}%
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>No funnel data</div>
        )}
      </div>

      {/* F. Top Users */}
      <SectionHeader title="Top Users" />
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--studio-border)" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--studio-border)" }}>
              {(
                [
                  { key: "email", label: "Email" },
                  { key: "projects", label: "Projects" },
                  { key: "layoutMds", label: "Layout.mds" },
                  { key: "variants", label: "Variants" },
                  { key: "cost", label: "Cost" },
                  { key: "lastActive", label: "Last Active" },
                  { key: "tier", label: "Tier" },
                  { key: "mode", label: "Mode" },
                  { key: "hasFigma", label: "Figma" },
                ] as Array<{ key: keyof UserRow; label: string }>
              ).map(({ key, label }) => (
                <th
                  key={key}
                  className="px-3 py-2.5 text-left font-medium cursor-pointer select-none hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                  onClick={() => toggleSort(key)}
                >
                  {label}
                  {sortKey === key && (
                    <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-4 text-center"
                  style={{ color: "var(--text-muted)", background: "var(--bg-panel)" }}
                >
                  No users
                </td>
              </tr>
            )}
            {sortedUsers.map((user, i) => (
              <tr
                key={user.email}
                style={{
                  background: i % 2 === 0 ? "var(--bg-panel)" : "rgba(20,20,24,0.6)",
                  borderBottom: "1px solid var(--studio-border)",
                }}
              >
                <td className="px-3 py-2 max-w-[160px] truncate" style={{ color: "var(--text-primary)" }}>
                  {user.email}
                </td>
                <td className="px-3 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {formatNumber(user.projects)}
                </td>
                <td className="px-3 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {formatNumber(user.layoutMds)}
                </td>
                <td className="px-3 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {formatNumber(user.variants)}
                </td>
                <td className="px-3 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {formatCurrency(user.cost)}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                  {formatRelativeTimestamp(user.lastActive)}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  {user.tier || "-"}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  {user.mode || "-"}
                </td>
                <td className="px-3 py-2" style={{ color: user.hasFigma ? "#8b5cf6" : "var(--text-muted)" }}>
                  {user.hasFigma ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* G. Billing Health */}
      <SectionHeader title="Billing Health" />
      <div className="grid grid-cols-2 gap-4">
        {/* Users at zero credits */}
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--bg-surface)",
            border: `1px solid ${(products?.billing?.usersAtZeroCredits ?? 0) > 0 ? "rgba(245,158,11,0.4)" : "var(--studio-border)"}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Users at Zero Credits
            </div>
            <div
              className="text-xl font-semibold"
              style={{ color: (products?.billing?.usersAtZeroCredits ?? 0) > 0 ? "#f59e0b" : "var(--text-secondary)" }}
            >
              {formatNumber(products?.billing?.usersAtZeroCredits)}
            </div>
          </div>
          {(products?.billing?.zeroCreditsEmails?.length ?? 0) > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {products!.billing!.zeroCreditsEmails.map((email) => (
                <div key={email} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {email}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {(products?.billing?.usersAtZeroCredits ?? 0) > 0 ? `${products!.billing!.usersAtZeroCredits} users at zero credits` : "All users have credits"}
            </div>
          )}
          {onSwitchTab && (
            <button
              onClick={() => onSwitchTab("credits")}
              className="mt-3 px-3 py-1 text-xs rounded-md"
              style={{ border: "1px solid var(--studio-border)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              Manage Credits
            </button>
          )}
        </div>

        {/* Top consumers */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            Top 10 Consumers
          </div>
          {topConsumers.length === 0 && (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>No data</div>
          )}
          {topConsumers.slice(0, 10).map((c) => (
            <div key={c.email} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <span
                className="text-xs truncate flex-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {c.email}
              </span>
              <div
                className="h-1.5 rounded-full flex-shrink-0"
                style={{
                  width: `${Math.round((c.cost / maxConsumerCost) * 80)}px`,
                  background: "#3b82f6",
                }}
              />
              <span
                className="text-xs tabular-nums flex-shrink-0"
                style={{ color: "var(--text-muted)", minWidth: "4rem", textAlign: "right" }}
              >
                {formatCurrency(c.cost)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* H. Errors & Issues */}
      <SectionHeader title="Errors & Issues (last 24h)" />

      {/* Endpoint badges */}
      {errors && Object.keys(errors.countByEndpoint).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(errors.countByEndpoint)
            .sort((a, b) => b[1] - a[1])
            .map(([ep, count]) => (
              <button
                key={ep}
                onClick={() => setEndpointFilter(endpointFilter === ep ? "all" : ep)}
                className="px-2 py-0.5 rounded text-xs transition-all"
                style={{
                  background: endpointFilter === ep ? "rgba(245,158,11,0.2)" : "var(--bg-elevated)",
                  border: `1px solid ${endpointFilter === ep ? "rgba(245,158,11,0.5)" : "var(--studio-border)"}`,
                  color: endpointFilter === ep ? "#f59e0b" : "var(--text-muted)",
                }}
              >
                {ep} ({count})
              </button>
            ))}
          {endpointFilter !== "all" && (
            <button
              onClick={() => setEndpointFilter("all")}
              className="px-2 py-0.5 rounded text-xs"
              style={{
                background: "transparent",
                border: "1px solid var(--studio-border)",
                color: "var(--text-muted)",
              }}
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--studio-border)" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--studio-border)" }}>
              {["Time", "Endpoint", "Status", "Message", "User"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredErrors.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center"
                  style={{ color: "var(--text-muted)", background: "var(--bg-panel)" }}
                >
                  {errors ? "No errors in last 24h" : "Loading..."}
                </td>
              </tr>
            )}
            {filteredErrors.map((err, i) => (
              <>
                <tr
                  key={i}
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedErrors((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i); else next.add(i);
                      return next;
                    })
                  }
                  style={{
                    background: i % 2 === 0 ? "var(--bg-panel)" : "rgba(20,20,24,0.6)",
                    borderBottom: expandedErrors.has(i) ? "none" : "1px solid var(--studio-border)",
                  }}
                >
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {formatRelativeTimestamp(err.timestamp)}
                  </td>
                  <td className="px-3 py-2 max-w-[160px] truncate font-mono" style={{ color: "var(--text-secondary)" }}>
                    {err.endpoint}
                  </td>
                  <td
                    className="px-3 py-2 font-mono"
                    style={{ color: err.status >= 500 ? "#ef4444" : "#f59e0b" }}
                  >
                    {err.status}
                  </td>
                  <td className="px-3 py-2 max-w-[280px] truncate" style={{ color: "var(--text-secondary)" }}>
                    {err.message.length > 60 ? err.message.slice(0, 60) + "..." : err.message}
                  </td>
                  <td className="px-3 py-2 max-w-[120px] truncate font-mono" style={{ color: "var(--text-muted)" }}>
                    {err.userId ?? "-"}
                  </td>
                </tr>
                {expandedErrors.has(i) && (
                  <tr
                    key={`${i}-expanded`}
                    style={{
                      background: i % 2 === 0 ? "var(--bg-panel)" : "rgba(20,20,24,0.6)",
                      borderBottom: "1px solid var(--studio-border)",
                    }}
                  >
                    <td colSpan={5} className="px-3 pb-3 pt-1">
                      <div
                        className="rounded-md p-3 font-mono text-xs whitespace-pre-wrap"
                        style={{
                          background: "var(--bg-app)",
                          border: "1px solid var(--studio-border)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <div className="mb-1 font-semibold" style={{ color: "var(--text-muted)" }}>Full message:</div>
                        <div className="mb-2">{err.message}</div>
                        {err.metadata && (
                          <>
                            <div className="mb-1 font-semibold" style={{ color: "var(--text-muted)" }}>Metadata:</div>
                            {JSON.stringify(err.metadata, null, 2)}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
}
