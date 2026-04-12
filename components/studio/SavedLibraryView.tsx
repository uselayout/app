"use client";

import { useState, useCallback, useEffect } from "react";
import { Copy, Check, Trash2, Loader2, Sparkles } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { buildSrcdoc, extractComponentName, sanitizeRelativeSrc } from "@/lib/explore/preview-helpers";
import { useOrgStore } from "@/lib/store/organization";
import { SavedComponentDetail } from "./SavedComponentDetail";
import type { Component } from "@/lib/types/component";

interface SavedLibraryViewProps {
  onNavigateToCanvas?: () => void;
  onOpenInCanvas?: (code: string, name: string) => void;
  onPushToFigma?: (code: string, name: string) => void;
}

function SavedCardPreview({ comp }: { comp: Component }) {
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      try {
        let js = comp.compiledJs;
        if (!js) {
          const res = await fetch("/api/transpile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: comp.code }),
          });
          if (!res.ok) { setError(true); return; }
          const data = await res.json();
          js = data.js;
        }
        if (!cancelled && js) {
          const name = extractComponentName(comp.code);
          const sanitised = sanitizeRelativeSrc(js);
          setSrcdoc(buildSrcdoc(sanitised, name));
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    prepare();
    return () => { cancelled = true; };
  }, [comp.code, comp.compiledJs]);

  if (error) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-t-lg bg-white text-xs text-neutral-400">
        Preview unavailable
      </div>
    );
  }

  if (!srcdoc) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-t-lg bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="relative h-[280px] overflow-hidden rounded-t-lg bg-white">
      <iframe
        srcDoc={srcdoc}
        sandbox="allow-scripts"
        className="h-[560px] w-[200%] origin-top-left scale-50 border-0"
        title={`Preview of ${comp.name}`}
      />
    </div>
  );
}

function SavedCard({
  comp,
  onCopy,
  onDelete,
  onClick,
  copiedId,
  deletingId,
}: {
  comp: Component;
  onCopy: (comp: Component) => void;
  onDelete: (comp: Component) => void;
  onClick: (comp: Component) => void;
  copiedId: string | null;
  deletingId: string | null;
}) {
  return (
    <div
      onClick={() => onClick(comp)}
      className="group flex flex-col rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--studio-border-strong)] cursor-pointer"
    >
      <SavedCardPreview comp={comp} />

      <div className="flex flex-1 flex-col gap-1.5 border-t border-[var(--studio-border)] p-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {comp.name}
          </h3>
          {comp.category && (
            <span className="shrink-0 rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] border border-[var(--studio-border)]">
              {comp.category}
            </span>
          )}
        </div>

        {comp.description && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
            {comp.description}
          </p>
        )}

        {comp.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {comp.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
              >
                {tag}
              </span>
            ))}
            {comp.tags.length > 4 && (
              <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                +{comp.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div onClick={(e) => e.stopPropagation()} role="presentation" className="flex items-center gap-1 border-t border-[var(--studio-border)] px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onCopy(comp)}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          {copiedId === comp.id ? (
            <>
              <Check size={12} className="text-[var(--status-success)]" />
              <span className="text-[var(--status-success)]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy code</span>
            </>
          )}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onDelete(comp)}
          disabled={deletingId === comp.id}
          className="rounded p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {deletingId === comp.id ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
        </button>
      </div>
    </div>
  );
}

export function SavedLibraryView({ onNavigateToCanvas, onOpenInCanvas, onPushToFigma }: SavedLibraryViewProps) {
  const orgId = useOrgStore((s) => s.currentOrgId);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"component" | "page">("component");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/organizations/${orgId}/components`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Component[]) => {
        if (!cancelled) setComponents(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [orgId]);

  const handleCopyCode = useCallback(async (comp: Component) => {
    const ok = await copyToClipboard(comp.code);
    if (ok) {
      setCopiedId(comp.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, []);

  const handleDelete = useCallback(
    async (comp: Component) => {
      if (!orgId) return;
      setDeletingId(comp.id);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/components/${comp.id}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setComponents((prev) => prev.filter((c) => c.id !== comp.id));
        }
      } finally {
        setDeletingId(null);
      }
    },
    [orgId]
  );

  const allOfType = components.filter((c) => c.designType === typeFilter);
  const categories = Array.from(
    new Set(allOfType.map((c) => c.category).filter(Boolean))
  ).sort() as string[];

  const filtered =
    categoryFilter === "all"
      ? allOfType
      : allOfType.filter((c) => c.category === categoryFilter);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Sign in to view saved components.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--studio-border)] px-5 py-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Saved</h2>

        {/* Type toggle */}
        <div className="flex items-center gap-0.5 rounded-lg bg-[var(--bg-surface)] p-0.5 border border-[var(--studio-border)]">
          {(["component", "page"] as const).map((f) => (
            <button
              key={f}
              aria-pressed={typeFilter === f}
              onClick={() => {
                setTypeFilter(f);
                setCategoryFilter("all");
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                typeFilter === f
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {f === "component" ? "Components" : "Pages"}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)] outline-none transition-colors hover:border-[var(--studio-border-strong)] focus:border-[var(--studio-border-focus)]"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {filtered.length} {typeFilter === "component" ? "component" : "page"}{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-xl bg-[var(--bg-surface)] p-4">
              <Sparkles size={24} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                No saved {typeFilter === "component" ? "components" : "pages"} yet
              </h3>
              <p className="max-w-xs text-xs text-[var(--text-secondary)]">
                Generate variants in the Canvas and save them here to build your library.
              </p>
            </div>
            {onNavigateToCanvas && (
              <button
                onClick={onNavigateToCanvas}
                className="rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-xs font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)]"
              >
                Open Canvas
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {filtered.map((comp) => (
              <SavedCard
                key={comp.id}
                comp={comp}
                onCopy={handleCopyCode}
                onDelete={handleDelete}
                onClick={setSelectedComponent}
                copiedId={copiedId}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>

      {selectedComponent && orgId && (
        <SavedComponentDetail
          component={selectedComponent}
          orgId={orgId}
          onClose={() => setSelectedComponent(null)}
          onUpdate={(updated) => {
            setComponents((prev) => prev.map((c) => c.id === updated.id ? updated : c));
            setSelectedComponent(updated);
          }}
          onDelete={(id) => {
            setComponents((prev) => prev.filter((c) => c.id !== id));
            setSelectedComponent(null);
          }}
          onPushToFigma={onPushToFigma ? (comp) => onPushToFigma(comp.code, comp.name) : undefined}
          onOpenInCanvas={onOpenInCanvas ? (comp) => {
            onOpenInCanvas(comp.code, comp.name);
            setSelectedComponent(null);
          } : undefined}
        />
      )}
    </div>
  );
}
