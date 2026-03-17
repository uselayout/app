"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, X, ExternalLink, ChevronRight, Palette, LayoutGrid, Image, Gauge, RefreshCw, BookMarked, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { CompletenessPanel } from "@/components/studio/CompletenessPanel";
import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import type {
  ExtractionResult,
  ExtractedToken,
  ExtractedComponent,
  SourceType,
} from "@/lib/types";
import type { Component } from "@/lib/types/component";

interface SourcePanelProps {
  extractionData?: ExtractionResult;
  sourceType: SourceType;
  sourceUrl?: string;
  designMd?: string;
  projectId?: string;
}

type TabId = "tokens" | "components" | "screenshots" | "quality" | "saved";

const VALID_TABS: TabId[] = ["tokens", "components", "screenshots", "quality", "saved"];

function SourcePanelInner({
  extractionData,
  designMd,
  projectId,
}: SourcePanelProps) {
  const searchParams = useSearchParams();
  const initialTab = VALID_TABS.includes(searchParams.get("tab") as TabId)
    ? (searchParams.get("tab") as TabId)
    : "tokens";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const syncTokensFromDesignMd = useProjectStore((s) => s.syncTokensFromDesignMd);
  const [syncResult, setSyncResult] = useState<{ count: number } | null>(null);

  const handleSyncTokens = useCallback(() => {
    if (!projectId) return;
    const count = syncTokensFromDesignMd(projectId);
    setSyncResult({ count });
    setTimeout(() => setSyncResult(null), 3000);
  }, [projectId, syncTokensFromDesignMd]);

  const hasDesignMd = !!designMd && designMd.length > 0;

  if (!extractionData) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[var(--bg-panel)] p-6">
        <p className="text-sm text-[var(--text-muted)] text-center">
          No extraction data yet. Extract a design system to see tokens here.
        </p>
        {hasDesignMd && projectId && (
          <button
            onClick={handleSyncTokens}
            className="mt-3 flex items-center gap-1.5 rounded-md bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <RefreshCw className="h-3 w-3" />
            Sync tokens from DESIGN.md
          </button>
        )}
        {syncResult && (
          <p className="mt-2 text-xs text-emerald-400">
            {syncResult.count > 0
              ? `Synced ${syncResult.count} tokens from DESIGN.md`
              : "No tokens found in DESIGN.md"}
          </p>
        )}
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "tokens", label: "Tokens", icon: Palette },
    { id: "components", label: "Components", icon: LayoutGrid },
    { id: "screenshots", label: "Screenshots", icon: Image },
    { id: "quality", label: "Quality", icon: Gauge },
    { id: "saved", label: "Saved", icon: BookMarked },
  ];

  return (
    <div className="flex h-full flex-col bg-[var(--bg-panel)]">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--studio-border)] px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`flex size-7 items-center justify-center rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-[rgba(255,255,255,0.1)] text-white"
                  : "text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        <div className="flex-1" />
        {hasDesignMd && projectId && activeTab === "tokens" && (
          <button
            onClick={handleSyncTokens}
            title="Sync tokens from DESIGN.md"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-[var(--text-muted)] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-secondary)]"
          >
            <RefreshCw className="h-3 w-3" />
            Sync
          </button>
        )}
      </div>
      {syncResult && (
        <div className={`px-2 py-1.5 text-xs ${syncResult.count > 0 ? "text-emerald-400 bg-emerald-500/5" : "text-[var(--text-muted)] bg-[var(--bg-surface)]"}`}>
          {syncResult.count > 0
            ? `Synced ${syncResult.count} tokens from DESIGN.md`
            : "No tokens found in DESIGN.md"}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "tokens" && (
          <TokensTab tokens={extractionData.tokens} projectId={projectId} />
        )}
        {activeTab === "components" && (
          <ComponentsTab components={extractionData.components} />
        )}
        {activeTab === "screenshots" && (
          <ScreenshotsTab screenshots={extractionData.screenshots} />
        )}
        {activeTab === "quality" && (
          <CompletenessPanel designMd={designMd ?? ""} />
        )}
        {activeTab === "saved" && <SavedTab />}
      </div>
    </div>
  );
}

export function SourcePanel(props: SourcePanelProps) {
  return (
    <Suspense fallback={null}>
      <SourcePanelInner {...props} />
    </Suspense>
  );
}

function TokenSectionHeader({
  label,
  count,
  open,
  onToggle,
  onCopy,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
    [onCopy]
  );

  return (
    <button
      onClick={onToggle}
      className="group flex w-full items-center gap-1.5 px-2 py-2 text-left"
    >
      <ChevronRight
        className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-150 ${
          open ? "rotate-90" : ""
        }`}
      />
      <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label} ({count})
      </span>
      <span
        onClick={handleCopy}
        className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-[var(--bg-hover)] group-hover:opacity-100"
        title={`Copy all ${label.toLowerCase()}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3 text-[var(--text-muted)]" />
        )}
      </span>
    </button>
  );
}

const SECTION_TYPE_MAP: Record<string, keyof import("@/lib/types").ExtractedTokens> = {
  Colours: "colors",
  Typography: "typography",
  Spacing: "spacing",
  Radius: "radius",
  Effects: "effects",
};

function TokensTab({
  tokens,
  projectId,
}: {
  tokens: ExtractionResult["tokens"];
  projectId?: string;
}) {
  const removeTokens = useProjectStore((s) => s.removeTokens);
  const updateExtractionData = useProjectStore((s) => s.updateExtractionData);

  const [undoState, setUndoState] = useState<{
    tokenType: keyof import("@/lib/types").ExtractedTokens;
    token: ExtractedToken;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);

  const handleDelete = useCallback(
    (sectionLabel: string, token: ExtractedToken) => {
      if (!projectId) return;
      const tokenType = SECTION_TYPE_MAP[sectionLabel];
      if (!tokenType) return;

      // Clear any existing undo timeout
      if (undoState) clearTimeout(undoState.timeoutId);

      removeTokens(projectId, tokenType, [token.name]);

      const timeoutId = setTimeout(() => setUndoState(null), 4000);
      setUndoState({ tokenType, token, timeoutId });
    },
    [projectId, removeTokens, undoState]
  );

  const handleUndo = useCallback(() => {
    if (!undoState || !projectId) return;
    clearTimeout(undoState.timeoutId);

    // Re-insert the token by reading current state and adding it back
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId);
    if (project?.extractionData) {
      const tokens = { ...project.extractionData.tokens };
      tokens[undoState.tokenType] = [...tokens[undoState.tokenType], undoState.token];
      updateExtractionData(projectId, { ...project.extractionData, tokens });
    }

    setUndoState(null);
  }, [undoState, projectId, updateExtractionData]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (undoState) clearTimeout(undoState.timeoutId);
    };
  }, [undoState]);

  const sections: { label: string; items: ExtractedToken[] }[] = [
    { label: "Colours", items: tokens.colors },
    { label: "Typography", items: tokens.typography },
    { label: "Spacing", items: tokens.spacing },
    { label: "Radius", items: tokens.radius },
    { label: "Effects", items: tokens.effects },
  ].filter((s) => s.items.length > 0);

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(sections.map((s) => s.label))
  );

  const toggleSection = useCallback((label: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  const copySection = useCallback((items: ExtractedToken[]) => {
    const text = items
      .map((t) => `${t.cssVariable ?? t.name}: ${t.value}`)
      .join("\n");
    copyToClipboard(text);
  }, []);

  if (sections.length === 0) {
    return (
      <div className="p-4 text-xs text-[var(--text-muted)]">
        No tokens extracted.
      </div>
    );
  }

  return (
    <div className="relative p-2">
      {sections.map((section) => (
        <div key={section.label} className="mb-1">
          <TokenSectionHeader
            label={section.label}
            count={section.items.length}
            open={openSections.has(section.label)}
            onToggle={() => toggleSection(section.label)}
            onCopy={() => copySection(section.items)}
          />
          {openSections.has(section.label) && (
            <div className="space-y-0.5 pl-2">
              {section.items.map((token) => (
                <TokenRow
                  key={token.name}
                  token={token}
                  onDelete={() => handleDelete(section.label, token)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      {undoState && (
        <div className="sticky bottom-0 flex items-center justify-between border-t border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2">
          <span className="text-xs text-[var(--text-secondary)]">Token removed</span>
          <button
            onClick={handleUndo}
            className="text-xs font-medium text-[var(--studio-accent)] hover:text-[var(--studio-accent-hover)] transition-colors"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

function TokenRow({ token, onDelete }: { token: ExtractedToken; onDelete?: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const varName = token.cssVariable ?? `--${token.name}`;
    const ok = await copyToClipboard(varName);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [token]);

  const isColor = token.type === "color";

  return (
    <button
      onClick={handleCopy}
      className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-hover)]"
    >
      {isColor && (
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-[var(--studio-border)]"
          style={{ backgroundColor: token.value }}
        />
      )}
      <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-primary)]">
        {token.cssVariable ?? token.name}
      </span>
      <span className="shrink-0 text-xs text-[var(--text-muted)]">
        {token.value}
      </span>
      <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        {copied ? (
          <Check className="h-3 w-3 text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3 text-[var(--text-muted)]" />
        )}
      </span>
      {onDelete && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-[rgba(255,255,255,0.06)] group-hover:opacity-100"
          title="Remove token"
        >
          <X className="h-3 w-3 text-[var(--text-muted)] hover:text-red-400 transition-colors" />
        </span>
      )}
    </button>
  );
}

function ComponentsTab({
  components,
}: {
  components: ExtractedComponent[];
}) {
  if (components.length === 0) {
    return (
      <div className="p-4 text-xs text-[var(--text-muted)]">
        No components extracted.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {components.map((component) => (
        <div
          key={component.name}
          className="flex items-center gap-2 rounded px-2 py-2 transition-colors hover:bg-[var(--bg-hover)]"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                {component.name}
              </span>
              {component.variantCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[10px] px-1.5 py-0"
                >
                  {component.variantCount} variants
                </Badge>
              )}
            </div>
            {component.description && (
              <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                {component.description}
              </p>
            )}
          </div>
          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
        </div>
      ))}
    </div>
  );
}

function ScreenshotsTab({ screenshots }: { screenshots: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx]);

  if (screenshots.length === 0) {
    return (
      <div className="p-4 text-xs text-[var(--text-muted)]">
        No screenshots captured. Screenshots are only available for website extractions.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-2">
        {screenshots.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            className="overflow-hidden rounded border border-[var(--studio-border)] transition-colors hover:border-[var(--studio-border-strong)]"
          >
            <img
              src={src.startsWith("data:") || src.startsWith("http") ? src : `data:image/png;base64,${src}`}
              alt={`Screenshot ${i + 1}`}
              className="h-auto w-full"
            />
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 rounded-full bg-[var(--bg-panel)] p-2 hover:bg-[var(--bg-elevated)]"
          >
            <X className="h-5 w-5 text-[var(--text-primary)]" />
          </button>
          <img
            src={
              screenshots[lightboxIdx].startsWith("data:") || screenshots[lightboxIdx].startsWith("http")
                ? screenshots[lightboxIdx]
                : `data:image/png;base64,${screenshots[lightboxIdx]}`
            }
            alt={`Screenshot ${lightboxIdx + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function SavedTab() {
  const orgId = useOrgStore((s) => s.currentOrgId);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "component" | "page">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/organizations/${orgId}/components`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Component[]) => {
        if (!cancelled) setComponents(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const handleCopyCode = useCallback(async (comp: Component) => {
    const ok = await copyToClipboard(comp.code);
    if (ok) {
      setCopiedId(comp.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="p-4 text-xs text-[var(--text-muted)]">
        Sign in to view saved components.
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="p-4 text-xs text-[var(--text-muted)]">
        No saved components yet. Promote variants from the Explorer Canvas to see them here.
      </div>
    );
  }

  const filtered =
    filter === "all"
      ? components
      : components.filter((c) => c.designType === filter);

  const grouped = filtered.reduce<Record<string, Component[]>>((acc, comp) => {
    const cat = comp.category || "Uncategorised";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(comp);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="p-2">
      {/* Filter pills */}
      <div className="mb-2 flex items-center gap-1">
        {(["all", "component", "page"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
              filter === f
                ? "bg-[rgba(255,255,255,0.1)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {f === "all" ? "All" : f === "component" ? "Components" : "Pages"}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">
          {filtered.length}
        </span>
      </div>

      {sortedCategories.map((cat) => (
        <div key={cat} className="mb-2">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {cat}
          </div>
          <div className="space-y-0.5">
            {grouped[cat].map((comp) => (
              <button
                key={comp.id}
                onClick={() => handleCopyCode(comp)}
                className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-hover)]"
              >
                <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-primary)]">
                  {comp.name}
                </span>
                {comp.tags.length > 0 && (
                  <span className="shrink-0 truncate max-w-[80px] text-[10px] text-[var(--text-muted)]">
                    {comp.tags[0]}
                  </span>
                )}
                <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                  {copiedId === comp.id ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-[var(--text-muted)]" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
