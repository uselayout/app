"use client";

import { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, X, ExternalLink, ChevronRight } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { CompletenessPanel } from "@/components/studio/CompletenessPanel";
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
  designMd?: string;
}

type TabId = "tokens" | "components" | "screenshots" | "quality";

export function SourcePanel({
  extractionData,
  designMd,
}: SourcePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tokens");

  if (!extractionData) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[var(--bg-panel)] p-6">
        <p className="text-sm text-[var(--text-muted)]">
          No extraction data yet. Extract a design system to see tokens here.
        </p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "tokens", label: "Tokens" },
    { id: "components", label: "Components" },
    { id: "screenshots", label: "Screenshots" },
    { id: "quality", label: "Quality" },
  ];

  return (
    <div className="flex h-full flex-col bg-[var(--bg-panel)]">
      {/* Tabs */}
      <div className="flex border-b border-[var(--studio-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-[var(--studio-accent)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "tokens" && (
          <TokensTab tokens={extractionData.tokens} />
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
      </div>
    </div>
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

function TokensTab({
  tokens,
}: {
  tokens: ExtractionResult["tokens"];
}) {
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
    <div className="p-2">
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
                <TokenRow key={token.name} token={token} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TokenRow({ token }: { token: ExtractedToken }) {
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
