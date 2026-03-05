"use client";

import { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Figma, Globe, Copy, Check, X, ExternalLink } from "lucide-react";
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
  onReExtract?: () => void;
}

type TabId = "tokens" | "components" | "screenshots";

export function SourcePanel({
  extractionData,
  sourceType,
  sourceUrl,
  onReExtract,
}: SourcePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tokens");

  if (!extractionData) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[--bg-panel] p-6">
        <p className="text-sm text-[--text-muted]">
          No extraction data yet. Extract a design system to see tokens here.
        </p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "tokens", label: "Tokens" },
    { id: "components", label: "Components" },
    { id: "screenshots", label: "Screenshots" },
  ];

  return (
    <div className="flex h-full flex-col bg-[--bg-panel]">
      {/* Source info */}
      <div className="border-b border-[--studio-border] p-3">
        <div className="flex items-center gap-2">
          {sourceType === "figma" ? (
            <Figma className="h-4 w-4 text-[--text-muted]" />
          ) : (
            <Globe className="h-4 w-4 text-[--text-muted]" />
          )}
          <Badge
            variant="secondary"
            className="bg-[--studio-accent-subtle] text-[--studio-accent]"
          >
            {sourceType === "figma" ? "Figma" : "Website"}
          </Badge>
          {sourceUrl && (
            <span className="truncate text-xs text-[--text-muted]">
              {(() => {
                try {
                  return new URL(sourceUrl).hostname;
                } catch {
                  return sourceUrl;
                }
              })()}
            </span>
          )}
        </div>
        {onReExtract && (
          <button
            onClick={onReExtract}
            className="mt-2 text-xs text-[--studio-accent] hover:underline"
          >
            Re-extract
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[--studio-border]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-[--studio-accent] text-[--text-primary]"
                : "text-[--text-muted] hover:text-[--text-secondary]"
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
      </div>
    </div>
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

  if (sections.length === 0) {
    return (
      <div className="p-4 text-xs text-[--text-muted]">
        No tokens extracted.
      </div>
    );
  }

  return (
    <div className="p-2">
      {sections.map((section) => (
        <div key={section.label} className="mb-4">
          <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[--text-muted]">
            {section.label} ({section.items.length})
          </h4>
          <div className="space-y-0.5">
            {section.items.map((token) => (
              <TokenRow key={token.name} token={token} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TokenRow({ token }: { token: ExtractedToken }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const varName = token.cssVariable ?? `--${token.name}`;
    navigator.clipboard.writeText(varName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [token]);

  const isColor = token.type === "color";

  return (
    <button
      onClick={handleCopy}
      className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[--bg-hover]"
    >
      {isColor && (
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-[--studio-border]"
          style={{ backgroundColor: token.value }}
        />
      )}
      <span className="min-w-0 flex-1 truncate text-xs text-[--text-primary]">
        {token.cssVariable ?? token.name}
      </span>
      <span className="shrink-0 text-xs text-[--text-muted]">
        {token.value}
      </span>
      <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        {copied ? (
          <Check className="h-3 w-3 text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3 text-[--text-muted]" />
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
      <div className="p-4 text-xs text-[--text-muted]">
        No components extracted.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {components.map((component) => (
        <div
          key={component.name}
          className="flex items-center gap-2 rounded px-2 py-2 transition-colors hover:bg-[--bg-hover]"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-xs font-medium text-[--text-primary]">
                {component.name}
              </span>
              {component.variantCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-[--bg-elevated] text-[--text-muted] text-[10px] px-1.5 py-0"
                >
                  {component.variantCount} variants
                </Badge>
              )}
            </div>
            {component.description && (
              <p className="mt-0.5 truncate text-[10px] text-[--text-muted]">
                {component.description}
              </p>
            )}
          </div>
          <ExternalLink className="h-3 w-3 shrink-0 text-[--text-muted]" />
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
      <div className="p-4 text-xs text-[--text-muted]">
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
            className="overflow-hidden rounded border border-[--studio-border] transition-colors hover:border-[--studio-border-strong]"
          >
            <img
              src={src.startsWith("data:") ? src : `data:image/png;base64,${src}`}
              alt={`Screenshot ${i + 1}`}
              className="h-auto w-full"
            />
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 rounded-full bg-[--bg-panel] p-2 hover:bg-[--bg-elevated]"
          >
            <X className="h-5 w-5 text-[--text-primary]" />
          </button>
          <img
            src={
              screenshots[lightboxIdx].startsWith("data:")
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
