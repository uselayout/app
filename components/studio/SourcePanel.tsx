"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, X, ExternalLink, ChevronRight, Palette, LayoutGrid, Image, Gauge, RefreshCw, Loader2, Plus, Trash2, Globe, Layers, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { CompletenessPanel } from "@/components/studio/CompletenessPanel";
import { useProjectStore } from "@/lib/store/project";
import { detectSourceType, normaliseUrl } from "@/lib/util/detect-source";
import { getStoredFigmaApiKey } from "@/lib/hooks/use-api-key";
import type {
  ExtractionResult,
  ExtractedToken,
  ExtractedComponent,
  SourceType,
} from "@/lib/types";

interface SourcePanelProps {
  extractionData?: ExtractionResult;
  sourceType: SourceType;
  sourceUrl?: string;
  layoutMd?: string;
  projectId?: string;
  onLayoutMdChange?: (value: string) => void;
  onExtract?: (url: string, sourceType: SourceType, pat?: string) => void;
}

type TabId = "tokens" | "components" | "screenshots" | "quality";

const VALID_TABS: TabId[] = ["tokens", "components", "screenshots", "quality"];

function SourcePanelEmptyState({
  projectId,
  hasLayoutMd,
  onSyncTokens,
  onExtract,
}: {
  projectId?: string;
  hasLayoutMd: boolean;
  onSyncTokens: () => void;
  onExtract?: (url: string, sourceType: SourceType, pat?: string) => void;
}) {
  const [url, setUrl] = useState("");
  const storedFigmaPat = getStoredFigmaApiKey();
  const [pat, setPat] = useState(storedFigmaPat);

  const sourceType = url ? detectSourceType(url) : null;
  const isFigma = sourceType === "figma";
  const isValid = sourceType !== null && (!isFigma || pat.length > 0);

  const handleExtract = () => {
    if (!isValid || !sourceType || !onExtract) return;
    onExtract(normaliseUrl(url), sourceType, isFigma ? pat : undefined);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 gap-4">
      <div className="w-full max-w-xs space-y-3">
        <p className="text-sm text-[var(--text-muted)] text-center">
          Add a source to extract your design system
        </p>

        <div className="relative">
          <input
            type="url"
            placeholder="figma.com/... or website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isValid && handleExtract()}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.16)] bg-[var(--bg-app)] px-3 py-2 pr-8 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
          />
          {sourceType && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {isFigma ? (
                <Layers className="h-3.5 w-3.5 text-[var(--studio-accent)]" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
              )}
            </div>
          )}
        </div>

        {isFigma && !storedFigmaPat && (
          <input
            type="password"
            placeholder="Figma Personal Access Token"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isValid && handleExtract()}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.16)] bg-[var(--bg-app)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
          />
        )}
        {isFigma && storedFigmaPat && (
          <p className="text-[10px] text-[var(--text-muted)]">
            Using Figma token from Settings.
          </p>
        )}

        <button
          onClick={handleExtract}
          disabled={!isValid || !onExtract}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-3 py-2 text-xs font-medium text-[var(--text-on-accent)] disabled:opacity-30 transition-colors hover:bg-[var(--studio-accent-hover)]"
        >
          Extract design system
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {hasLayoutMd && projectId && (
        <button
          onClick={onSyncTokens}
          className="flex items-center gap-1.5 rounded-md bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <RefreshCw className="h-3 w-3" />
          Or sync tokens from layout.md
        </button>
      )}
    </div>
  );
}

function SourcePanelInner({
  extractionData,
  layoutMd,
  projectId,
  onLayoutMdChange,
  onExtract,
}: SourcePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tokens");
  const syncTokensFromLayoutMd = useProjectStore((s) => s.syncTokensFromLayoutMd);
  const updateExtractionData = useProjectStore((s) => s.updateExtractionData);
  const [syncResult, setSyncResult] = useState<{ count: number } | null>(null);

  const handleDeleteScreenshot = useCallback(
    (index: number) => {
      if (!projectId || !extractionData) return;
      const updated = { ...extractionData, screenshots: extractionData.screenshots.filter((_, i) => i !== index) };
      updateExtractionData(projectId, updated);
    },
    [projectId, extractionData, updateExtractionData],
  );

  const handleAddScreenshot = useCallback(
    (dataUrl: string) => {
      if (!projectId || !extractionData) return;
      const updated = { ...extractionData, screenshots: [...extractionData.screenshots, dataUrl] };
      updateExtractionData(projectId, updated);
    },
    [projectId, extractionData, updateExtractionData],
  );

  const handleSyncTokens = useCallback(() => {
    if (!projectId) return;
    const count = syncTokensFromLayoutMd(projectId);
    setSyncResult({ count });
    setTimeout(() => setSyncResult(null), 3000);
  }, [projectId, syncTokensFromLayoutMd]);

  const hasLayoutMd = !!layoutMd && layoutMd.length > 0;

  const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "tokens", label: "Tokens", icon: Palette },
    { id: "components", label: "Components", icon: LayoutGrid },
    { id: "screenshots", label: "Screenshots", icon: Image },
    { id: "quality", label: "Quality", icon: Gauge },
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
        {hasLayoutMd && projectId && activeTab === "tokens" && (
          <button
            onClick={handleSyncTokens}
            title="Sync tokens from layout.md"
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
            ? `Synced ${syncResult.count} tokens from layout.md`
            : "No tokens found in layout.md"}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!extractionData && (
          <SourcePanelEmptyState
            projectId={projectId}
            hasLayoutMd={hasLayoutMd}
            onSyncTokens={handleSyncTokens}
            onExtract={onExtract}
          />
        )}
        {activeTab === "tokens" && extractionData && (
          <TokensTab tokens={extractionData.tokens} projectId={projectId} />
        )}
        {activeTab === "components" && extractionData && (
          <ComponentsTab components={extractionData.components} />
        )}
        {activeTab === "screenshots" && extractionData && (
          <ScreenshotsTab screenshots={extractionData.screenshots} onDelete={handleDeleteScreenshot} onAdd={handleAddScreenshot} />
        )}
        {activeTab === "quality" && extractionData && (
          <CompletenessPanel layoutMd={layoutMd ?? ""} onLayoutMdChange={onLayoutMdChange} />
        )}
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

function ScreenshotsTab({
  screenshots,
  onDelete,
  onAdd,
}: {
  screenshots: string[];
  onDelete?: (index: number) => void;
  onAdd?: (dataUrl: string) => void;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.value = "";
  }, []);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onAdd) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") onAdd(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [onAdd],
  );

  return (
    <>
      {/* Add screenshot button */}
      {onAdd && (
        <div className="border-b border-[var(--studio-border)] p-2">
          <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--studio-border)] px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--studio-border-strong)] hover:text-[var(--text-secondary)]">
            <Plus className="h-3.5 w-3.5" />
            Add screenshot
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {screenshots.length === 0 ? (
        <div className="p-4 text-xs text-[var(--text-muted)]">
          No screenshots captured. Add screenshots or extract from a website.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-2">
          {screenshots.map((src, i) => (
            <div key={i} className="group relative">
              <button
                onClick={() => setLightboxIdx(i)}
                className="w-full overflow-hidden rounded border border-[var(--studio-border)] transition-colors hover:border-[var(--studio-border-strong)]"
              >
                <img
                  src={src.startsWith("data:") || src.startsWith("http") ? src : `data:image/png;base64,${src}`}
                  alt={`Screenshot ${i + 1}`}
                  className="h-auto w-full"
                />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(i)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-red-600/90 hover:text-white group-hover:opacity-100"
                  title="Remove screenshot"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

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

