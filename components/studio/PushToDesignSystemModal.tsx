"use client";

import { useState, useCallback, useMemo } from "react";
import { X, ArrowUpToLine, Loader2, Check, ChevronRight } from "lucide-react";
import { extractComponentName } from "@/lib/explore/preview-helpers";
import { toast } from "sonner";
import type { Project, ExtractedToken } from "@/lib/types";

interface PushToDesignSystemModalProps {
  project: Project;
  orgId: string;
  onClose: () => void;
}

type TabId = "tokens" | "components";

interface PushableComponent {
  id: string;
  name: string;
  code: string;
  source: "explorer" | "test-panel";
  rationale?: string;
  healthScore?: number;
}

function flattenTokens(project: Project): ExtractedToken[] {
  const data = project.extractionData;
  if (!data?.tokens) return [];
  return [
    ...data.tokens.colors,
    ...data.tokens.typography,
    ...data.tokens.spacing,
    ...data.tokens.radius,
    ...data.tokens.effects,
  ];
}

function collectComponents(project: Project): PushableComponent[] {
  const components: PushableComponent[] = [];

  // From explorer variants
  if (project.explorations) {
    for (const session of project.explorations) {
      for (const variant of session.variants) {
        components.push({
          id: variant.id,
          name: extractComponentName(variant.code),
          code: variant.code,
          source: "explorer",
          rationale: variant.rationale,
          healthScore: variant.healthScore?.total,
        });
      }
    }
  }

  // From test results (only those with code output)
  if (project.testResults) {
    for (const result of project.testResults) {
      if (result.output && result.output.includes("function")) {
        components.push({
          id: result.id,
          name: extractComponentName(result.output),
          code: result.output,
          source: "test-panel",
          healthScore: result.healthScore?.total,
        });
      }
    }
  }

  return components;
}

function tokenTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    color: "Colours",
    typography: "Typography",
    spacing: "Spacing",
    radius: "Radius",
    effect: "Effects",
    motion: "Motion",
  };
  return labels[type] ?? type;
}

export function PushToDesignSystemModal({
  project,
  orgId,
  onClose,
}: PushToDesignSystemModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tokens");
  const [pushing, setPushing] = useState(false);

  const allTokens = useMemo(() => flattenTokens(project), [project]);
  const allComponents = useMemo(() => collectComponents(project), [project]);

  const [selectedTokenIds, setSelectedTokenIds] = useState<Set<number>>(
    () => new Set(allTokens.map((_, i) => i))
  );
  const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(
    () => new Set(allComponents.map((c) => c.id))
  );

  // Group tokens by type
  const tokenGroups = useMemo(() => {
    const groups: Record<string, { tokens: ExtractedToken[]; indices: number[] }> = {};
    allTokens.forEach((token, index) => {
      if (!groups[token.type]) {
        groups[token.type] = { tokens: [], indices: [] };
      }
      groups[token.type].tokens.push(token);
      groups[token.type].indices.push(index);
    });
    return groups;
  }, [allTokens]);

  const toggleAllTokensInGroup = useCallback(
    (indices: number[]) => {
      setSelectedTokenIds((prev) => {
        const next = new Set(prev);
        const allSelected = indices.every((i) => next.has(i));
        if (allSelected) {
          indices.forEach((i) => next.delete(i));
        } else {
          indices.forEach((i) => next.add(i));
        }
        return next;
      });
    },
    []
  );

  const toggleToken = useCallback((index: number) => {
    setSelectedTokenIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleComponent = useCallback((id: string) => {
    setSelectedComponentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedTokenCount = selectedTokenIds.size;
  const selectedComponentCount = selectedComponentIds.size;
  const totalSelected = selectedTokenCount + selectedComponentCount;

  const handlePush = useCallback(async () => {
    if (totalSelected === 0 || pushing) return;

    setPushing(true);

    try {
      const tokens = [...selectedTokenIds].map((i) => {
        const t = allTokens[i];
        return {
          name: t.name,
          value: t.value,
          type: t.type,
          category: t.category,
          cssVariable: t.cssVariable,
          description: t.description,
          groupName: t.type,
        };
      });

      const components = allComponents
        .filter((c) => selectedComponentIds.has(c.id))
        .map((c) => ({
          name: c.name,
          code: c.code,
          source: c.source === "explorer" ? "explorer" : "extraction",
          description: c.rationale,
        }));

      const res = await fetch(
        `/api/organizations/${orgId}/design-system/push`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokens,
            components,
            projectId: project.id,
          }),
        }
      );

      if (!res.ok) {
        const body = await res
          .json()
          .catch(() => ({ error: "Push failed" }));
        throw new Error(
          (body as { error?: string }).error ?? "Push failed"
        );
      }

      const result = await res.json() as {
        tokensCreated: number;
        tokensSkipped: number;
        componentsCreated: number;
        componentsSkipped: number;
      };

      const parts: string[] = [];
      if (result.tokensCreated > 0) {
        parts.push(`${result.tokensCreated} token${result.tokensCreated === 1 ? "" : "s"}`);
      }
      if (result.componentsCreated > 0) {
        parts.push(`${result.componentsCreated} component${result.componentsCreated === 1 ? "" : "s"}`);
      }

      const skippedParts: string[] = [];
      if (result.tokensSkipped > 0) {
        skippedParts.push(`${result.tokensSkipped} token${result.tokensSkipped === 1 ? "" : "s"}`);
      }
      if (result.componentsSkipped > 0) {
        skippedParts.push(`${result.componentsSkipped} component${result.componentsSkipped === 1 ? "" : "s"}`);
      }

      let message = parts.length > 0
        ? `Pushed ${parts.join(" and ")} to design system`
        : "Nothing new to push";

      if (skippedParts.length > 0) {
        message += ` (${skippedParts.join(" and ")} already existed)`;
      }

      toast.success(message);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to push to design system"
      );
    } finally {
      setPushing(false);
    }
  }, [
    totalSelected,
    pushing,
    selectedTokenIds,
    selectedComponentIds,
    allTokens,
    allComponents,
    orgId,
    project.id,
    onClose,
  ]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "tokens", label: "Tokens", count: allTokens.length },
    { id: "components", label: "Components", count: allComponents.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative flex w-full max-w-2xl flex-col rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] shadow-2xl max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface)]">
              <ArrowUpToLine size={16} className="text-[var(--studio-accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Push to Design System
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Select tokens and components to add to your org library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--studio-border)] px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-[var(--studio-accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-60">{tab.count}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[var(--studio-accent)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
          {activeTab === "tokens" && (
            <div className="space-y-3">
              {allTokens.length === 0 ? (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No extracted tokens available. Run an extraction first.
                </p>
              ) : (
                Object.entries(tokenGroups).map(([type, { tokens, indices }]) => {
                  const allSelected = indices.every((i) => selectedTokenIds.has(i));
                  const someSelected = indices.some((i) => selectedTokenIds.has(i));

                  return (
                    <div key={type}>
                      <button
                        onClick={() => toggleAllTokensInGroup(indices)}
                        className="flex w-full items-center gap-2 py-1.5 text-left"
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] transition-colors ${
                            allSelected
                              ? "border-[var(--studio-accent)] bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                              : someSelected
                                ? "border-[var(--studio-accent)] bg-[var(--studio-accent-subtle)]"
                                : "border-[var(--studio-border-strong)]"
                          }`}
                        >
                          {allSelected && <Check size={10} />}
                          {someSelected && !allSelected && (
                            <span className="block h-1.5 w-1.5 rounded-sm bg-[var(--studio-accent)]" />
                          )}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {tokenTypeLabel(type)}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {tokens.length}
                        </span>
                      </button>

                      <div className="ml-6 space-y-0.5">
                        {tokens.map((token, localIdx) => {
                          const globalIdx = indices[localIdx];
                          const isSelected = selectedTokenIds.has(globalIdx);

                          return (
                            <button
                              key={globalIdx}
                              onClick={() => toggleToken(globalIdx)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <span
                                className={`flex h-3.5 w-3.5 items-center justify-center rounded border text-[10px] transition-colors ${
                                  isSelected
                                    ? "border-[var(--studio-accent)] bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                                    : "border-[var(--studio-border-strong)]"
                                }`}
                              >
                                {isSelected && <Check size={8} />}
                              </span>

                              {token.type === "color" && (
                                <span
                                  className="h-3 w-3 rounded-sm border border-[var(--studio-border)] shrink-0"
                                  style={{ backgroundColor: token.value }}
                                />
                              )}

                              <span className="flex-1 truncate text-[11px] text-[var(--text-secondary)]">
                                {token.name}
                              </span>
                              <span className="shrink-0 text-[10px] font-mono text-[var(--text-muted)]">
                                {token.value}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "components" && (
            <div className="space-y-1">
              {allComponents.length === 0 ? (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No generated components available. Use the Test Panel or Explorer
                  to generate components first.
                </p>
              ) : (
                allComponents.map((comp) => {
                  const isSelected = selectedComponentIds.has(comp.id);

                  return (
                    <button
                      key={comp.id}
                      onClick={() => toggleComponent(comp.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] shrink-0 transition-colors ${
                          isSelected
                            ? "border-[var(--studio-accent)] bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                            : "border-[var(--studio-border-strong)]"
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[var(--text-primary)]">
                            {comp.name}
                          </span>
                          <span className="rounded-full bg-[var(--bg-surface)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">
                            {comp.source === "explorer" ? "Explorer" : "Test"}
                          </span>
                          {comp.healthScore != null && (
                            <span className="text-[9px] text-[var(--text-muted)]">
                              {Math.round(comp.healthScore)}%
                            </span>
                          )}
                        </div>
                        {comp.rationale && (
                          <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                            {comp.rationale}
                          </p>
                        )}
                      </div>

                      <ChevronRight
                        size={12}
                        className="shrink-0 text-[var(--text-muted)]"
                      />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--studio-border)] px-5 py-4">
          <p className="text-xs text-[var(--text-muted)]">
            {selectedTokenCount} token{selectedTokenCount === 1 ? "" : "s"},{" "}
            {selectedComponentCount} component
            {selectedComponentCount === 1 ? "" : "s"} selected
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePush}
              disabled={pushing || totalSelected === 0}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-1.5 text-xs font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pushing ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <ArrowUpToLine size={12} />
                  Push to Design System
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
