"use client";

import { useCallback, useEffect, useState } from "react";

// --- Types ---

interface PromptEntry {
  prompt: string | null;
  modelId: string | null;
  variantCount: number | null;
  isRefinement: boolean;
  hasImageUpload: boolean;
  userId: string | null;
  userEmail: string;
  createdAt: string;
}

interface SavedComponent {
  id: string;
  name: string;
  code: string;
  category: string;
  tags: string[];
  designType: string;
  source: string;
  orgId: string;
  createdBy: string | null;
  createdByEmail: string;
  createdAt: string;
}

// --- Helpers ---

function formatRelativeTime(iso: string): string {
  try {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "-";
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

// --- Sub-components ---

function SectionHeader({ title }: { title: string }) {
  return (
    <h3
      className="text-sm font-semibold mb-3 mt-8 first:mt-0"
      style={{ color: "var(--text-primary)" }}
    >
      {title}
    </h3>
  );
}

// --- Main ---

export function VariantsTab() {
  const [prompts, setPrompts] = useState<PromptEntry[] | null>(null);
  const [components, setComponents] = useState<SavedComponent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [promptsRes, componentsRes] = await Promise.all([
        fetch(`/api/admin/prompts?days=${days}`).then((r) => r.json()),
        fetch("/api/admin/components").then((r) => r.json()),
      ]);
      setPrompts(promptsRes.prompts ?? []);
      setComponents(componentsRes.components ?? []);
    } catch (err) {
      console.error("Failed to fetch variants data:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredComponents = (components ?? []).filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div>
      {/* --- Recent Prompts --- */}
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title="Recent Prompts" />
        <div className="flex items-center gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="px-2 py-0.5 rounded text-xs transition-all"
              style={{
                background: days === d ? "var(--bg-elevated)" : "transparent",
                color: days === d ? "var(--text-primary)" : "var(--text-muted)",
                border: `1px solid ${days === d ? "var(--studio-border-strong)" : "transparent"}`,
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg overflow-x-auto mb-8"
        style={{ border: "1px solid var(--studio-border)" }}
      >
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--studio-border)" }}>
              {["Time", "User", "Prompt", "Model", "Count", "Type"].map((h) => (
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
            {loading && !prompts && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center" style={{ color: "var(--text-muted)", background: "var(--bg-panel)" }}>
                  Loading...
                </td>
              </tr>
            )}
            {prompts && prompts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center" style={{ color: "var(--text-muted)", background: "var(--bg-panel)" }}>
                  No variant generations in last {days} days
                </td>
              </tr>
            )}
            {(prompts ?? []).map((p, i) => (
              <tr
                key={i}
                className="cursor-pointer transition-colors"
                onClick={() => setExpandedPrompt(expandedPrompt === i ? null : i)}
                style={{
                  background: expandedPrompt === i ? "var(--bg-surface)" : "var(--bg-panel)",
                  borderBottom: "1px solid var(--studio-border)",
                }}
                onMouseEnter={(e) => { if (expandedPrompt !== i) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (expandedPrompt !== i) e.currentTarget.style.background = "var(--bg-panel)"; }}
              >
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {formatRelativeTime(p.createdAt)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-mono" style={{ color: "var(--text-secondary)" }}>
                  {p.userEmail}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-primary)", maxWidth: 300 }}>
                  {expandedPrompt === i
                    ? (p.prompt ?? <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No prompt logged (pre-logging)</span>)
                    : p.prompt ? truncate(p.prompt, 80) : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>-</span>
                  }
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-mono" style={{ color: "var(--text-muted)" }}>
                  {p.modelId ? p.modelId.replace("claude-", "").replace("gemini-", "gem-") : "-"}
                </td>
                <td className="px-3 py-2 text-center tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {p.variantCount ?? "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1">
                    {p.isRefinement && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                        Refine
                      </span>
                    )}
                    {p.hasImageUpload && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
                        Image
                      </span>
                    )}
                    {!p.isRefinement && !p.hasImageUpload && "New"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Saved Components --- */}
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title={`Saved from Explorer (${filteredComponents.length})`} />
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 rounded text-xs"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--studio-border)",
            color: "var(--text-primary)",
            width: 180,
          }}
        />
      </div>

      <div
        className="rounded-lg overflow-x-auto"
        style={{ border: "1px solid var(--studio-border)" }}
      >
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--studio-border)" }}>
              {["Name", "Category", "Tags", "Type", "Created By", "Date"].map((h) => (
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
            {loading && !components && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center" style={{ color: "var(--text-muted)", background: "var(--bg-panel)" }}>
                  Loading...
                </td>
              </tr>
            )}
            {filteredComponents.length === 0 && components && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center" style={{ color: "var(--text-muted)", background: "var(--bg-panel)" }}>
                  {search ? "No matching components" : "No saved Explorer components yet"}
                </td>
              </tr>
            )}
            {filteredComponents.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer transition-colors"
                onClick={() => setExpandedComponent(expandedComponent === c.id ? null : c.id)}
                style={{
                  background: expandedComponent === c.id ? "var(--bg-surface)" : "var(--bg-panel)",
                  borderBottom: "1px solid var(--studio-border)",
                }}
                onMouseEnter={(e) => { if (expandedComponent !== c.id) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (expandedComponent !== c.id) e.currentTarget.style.background = "var(--bg-panel)"; }}
              >
                <td className="px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>
                  {c.name}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  {c.category || "-"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(c.tags ?? []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded text-[10px]"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                      >
                        {t}
                      </span>
                    ))}
                    {(c.tags ?? []).length > 3 && (
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        +{c.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 capitalize" style={{ color: "var(--text-muted)" }}>
                  {c.designType}
                </td>
                <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {c.createdByEmail}
                </td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {formatRelativeTime(c.createdAt)}
                </td>
              </tr>
            ))}
            {/* Expanded code view */}
            {filteredComponents.map((c) =>
              expandedComponent === c.id ? (
                <tr key={`${c.id}-code`}>
                  <td
                    colSpan={6}
                    className="px-3 py-3"
                    style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--studio-border)" }}
                  >
                    <pre
                      className="text-[11px] leading-relaxed overflow-x-auto rounded p-3"
                      style={{
                        background: "var(--bg-app)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--studio-border)",
                        maxHeight: 400,
                        overflowY: "auto",
                      }}
                    >
                      {c.code}
                    </pre>
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
