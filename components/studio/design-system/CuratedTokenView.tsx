"use client";

import { useMemo } from "react";
import type { ExtractedToken, ProjectStandardisation } from "@/lib/types";
import {
  SCHEMA_CATEGORIES,
  getRolesByCategory,
  type StandardRoleCategory,
  type StandardRole,
} from "@/lib/tokens/standard-schema";
import { toHex } from "@/lib/util/color";
import { resolveTokenValue } from "@/lib/util/color";
import { ColourSwatchCard } from "./ColourSwatchCard";
import { DesignSystemSection } from "./DesignSystemSection";

interface CuratedTokenViewProps {
  standardisation: ProjectStandardisation;
  allTokens: ExtractedToken[];
  cssVariables: Record<string, string>;
  onUpdateToken: (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", name: string, value: string) => void;
  onRemoveToken: (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", names: string[]) => void;
  onRenameToken: (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", oldName: string, newName: string) => void;
}

export function CuratedTokenView({
  standardisation,
  allTokens,
  cssVariables,
  onUpdateToken,
  onRemoveToken,
  onRenameToken,
}: CuratedTokenViewProps) {
  const { assignments } = standardisation;

  // Build a lookup from role key to the actual token
  const roleTokenMap = useMemo(() => {
    const map = new Map<string, ExtractedToken>();
    for (const [roleKey, assignment] of Object.entries(assignments)) {
      const token = allTokens.find(
        (t) =>
          (t.cssVariable ?? t.name) === (assignment.originalCssVariable ?? assignment.originalName) &&
          t.value === assignment.value
      );
      if (token) {
        map.set(roleKey, token);
      }
    }
    return map;
  }, [assignments, allTokens]);

  // Count assigned roles per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { assigned: number; total: number }> = {};
    for (const cat of SCHEMA_CATEGORIES) {
      const roles = getRolesByCategory(cat.key);
      const assigned = roles.filter((r) => assignments[r.key]).length;
      counts[cat.key] = { assigned, total: roles.length };
    }
    return counts;
  }, [assignments]);

  // Only show colour categories for now (the main value)
  const colourCategories: StandardRoleCategory[] = ["backgrounds", "text", "borders", "accent", "status"];

  return (
    <div className="space-y-8">
      {/* Stats banner */}
      <div className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-primary)]">
            Curated Design System
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
            {Object.values(assignments).length} tokens mapped to standard roles.
            {standardisation.unassigned.filter((u) => !u.hidden).length > 0 && (
              <> {standardisation.unassigned.filter((u) => !u.hidden).length} unassigned.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {Object.values(assignments).filter((a) => a.confidence === "high").length > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              {Object.values(assignments).filter((a) => a.confidence === "high").length} high
            </span>
          )}
          {Object.values(assignments).filter((a) => a.confidence === "medium").length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              {Object.values(assignments).filter((a) => a.confidence === "medium").length} medium
            </span>
          )}
          {Object.values(assignments).filter((a) => a.confidence === "low").length > 0 && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
              {Object.values(assignments).filter((a) => a.confidence === "low").length} low
            </span>
          )}
        </div>
      </div>

      {/* Colour roles */}
      {colourCategories.map((catKey) => {
        const catDef = SCHEMA_CATEGORIES.find((c) => c.key === catKey);
        if (!catDef) return null;
        const roles = getRolesByCategory(catKey);
        const counts = categoryCounts[catKey];
        if (!counts) return null;

        return (
          <DesignSystemSection
            key={catKey}
            id={`curated-${catKey}`}
            title={catDef.label}
            count={counts.assigned}
            subtitle={`${counts.assigned}/${counts.total}`}
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
              {roles.map((role) => {
                const assignment = assignments[role.key];
                const token = roleTokenMap.get(role.key);

                if (assignment && token) {
                  const resolved = resolveTokenValue(token.value, cssVariables);
                  return (
                    <div key={role.key} className="relative">
                      <ColourSwatchCard
                        name={token.name}
                        cssVariable={token.cssVariable}
                        value={token.value}
                        resolvedValue={resolved}
                        description={`${role.label}: ${role.description}`}
                        onUpdate={(newValue) =>
                          onUpdateToken("colors", token.name, newValue)
                        }
                        onRemove={() => onRemoveToken("colors", [token.name])}
                        onRename={(newName) =>
                          onRenameToken("colors", token.name, newName)
                        }
                      />
                      {/* Role label below the swatch */}
                      <div className="mt-1 text-center">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          {role.label}
                        </span>
                        {assignment.confidence !== "high" && (
                          <span
                            className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${
                              assignment.confidence === "medium"
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                            title={`${assignment.confidence} confidence`}
                          />
                        )}
                      </div>
                    </div>
                  );
                }

                // Empty slot
                return (
                  <div
                    key={role.key}
                    className="flex flex-col items-center gap-2"
                    title={role.description}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-[var(--studio-border)] text-[var(--text-muted)]">
                      <span className="text-lg">+</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {role.label}
                      </span>
                      {role.required && (
                        <span className="text-[8px] text-[var(--text-muted)] opacity-50">
                          required
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DesignSystemSection>
        );
      })}

      {/* Non-colour categories: typography, spacing, radius */}
      {(["typography", "spacing", "radius"] as StandardRoleCategory[]).map((catKey) => {
        const catDef = SCHEMA_CATEGORIES.find((c) => c.key === catKey);
        if (!catDef) return null;
        const roles = getRolesByCategory(catKey);
        const counts = categoryCounts[catKey];
        if (!counts || counts.assigned === 0) return null;

        return (
          <DesignSystemSection
            key={catKey}
            id={`curated-${catKey}`}
            title={catDef.label}
            count={counts.assigned}
            subtitle={`${counts.assigned}/${counts.total}`}
          >
            <div className="space-y-1">
              {roles.map((role) => {
                const assignment = assignments[role.key];
                const token = roleTokenMap.get(role.key);

                return (
                  <div
                    key={role.key}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                      assignment ? "" : "opacity-40"
                    }`}
                  >
                    <span className="w-24 shrink-0 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {role.label}
                    </span>
                    {token ? (
                      <>
                        <code className="font-mono text-xs text-[var(--text-secondary)]">
                          {token.cssVariable ?? `--${token.name}`}
                        </code>
                        <code className="font-mono text-xs text-[var(--text-muted)]">
                          {token.value}
                        </code>
                      </>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] italic">
                        not assigned
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </DesignSystemSection>
        );
      })}

      {/* Anti-patterns */}
      {standardisation.antiPatterns.length > 0 && (
        <DesignSystemSection
          id="curated-antipatterns"
          title="Anti-Patterns Detected"
          count={standardisation.antiPatterns.length}
        >
          <div className="space-y-3">
            {standardisation.antiPatterns.map((ap, i) => (
              <div
                key={i}
                className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2"
              >
                <p className="text-xs font-medium text-amber-300">{ap.rule}</p>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">{ap.reason}</p>
                <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{ap.fix}</p>
              </div>
            ))}
          </div>
        </DesignSystemSection>
      )}

      {/* Unassigned tokens */}
      {standardisation.unassigned.filter((u) => !u.hidden).length > 0 && (
        <DesignSystemSection
          id="curated-unassigned"
          title="Unassigned Tokens"
          count={standardisation.unassigned.filter((u) => !u.hidden).length}
        >
          <p className="mb-3 text-[10px] text-[var(--text-muted)]">
            These tokens were extracted but not mapped to a standard role. They are still available in All Tokens view and in the layout.md appendix.
          </p>
          <div className="space-y-1">
            {standardisation.unassigned
              .filter((u) => !u.hidden)
              .slice(0, 30)
              .map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded px-2 py-1 text-xs"
                >
                  {u.type === "color" && (
                    <div
                      className="h-4 w-4 shrink-0 rounded border border-[var(--studio-border)]"
                      style={{ backgroundColor: u.value }}
                    />
                  )}
                  <code className="font-mono text-[var(--text-secondary)]">
                    {u.cssVariable ?? u.name}
                  </code>
                  <code className="font-mono text-[var(--text-muted)]">{u.value}</code>
                </div>
              ))}
            {standardisation.unassigned.filter((u) => !u.hidden).length > 30 && (
              <p className="px-2 text-[10px] text-[var(--text-muted)]">
                + {standardisation.unassigned.filter((u) => !u.hidden).length - 30} more
              </p>
            )}
          </div>
        </DesignSystemSection>
      )}
    </div>
  );
}
