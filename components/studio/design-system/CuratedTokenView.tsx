"use client";

import { useMemo, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import type { ExtractedToken, ProjectStandardisation, DesignSystemSnapshot, TokenType } from "@/lib/types";
import {
  SCHEMA_CATEGORIES,
  getRolesByCategory,
  STANDARD_SCHEMA,
  type StandardRoleCategory,
} from "@/lib/tokens/standard-schema";
import { resolveTokenValue } from "@/lib/util/color";
import { ColourSwatchCard } from "./ColourSwatchCard";
import { DesignSystemSection } from "./DesignSystemSection";
import { SnapshotManager } from "./SnapshotManager";
import { LayoutMdCompareModal } from "./LayoutMdCompareModal";
import { AssignTokenPopover } from "./AssignTokenPopover";
import { useProjectStore } from "@/lib/store/project";
import { buildStandardName } from "@/lib/tokens/standard-schema";
import { AddTokenForm } from "@/components/studio/AddTokenForm";

const TOKEN_TYPE_FOR_CATEGORY: Record<StandardRoleCategory, TokenType> = {
  backgrounds: "color",
  text: "color",
  borders: "color",
  accent: "color",
  status: "color",
  typography: "typography",
  spacing: "spacing",
  radius: "radius",
  shadows: "effect",
  motion: "motion",
};

interface CuratedTokenViewProps {
  projectId: string;
  standardisation: ProjectStandardisation;
  allTokens: ExtractedToken[];
  cssVariables: Record<string, string>;
  snapshots: DesignSystemSnapshot[];
  currentLayoutMd: string;
  onUpdateToken: (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", name: string, value: string) => void;
  onRemoveToken: (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", names: string[]) => void;
  onRenameToken: (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", oldName: string, newName: string) => void;
}

export function CuratedTokenView({
  projectId,
  standardisation,
  allTokens,
  cssVariables,
  snapshots,
  currentLayoutMd,
  onUpdateToken,
  onRemoveToken,
  onRenameToken,
}: CuratedTokenViewProps) {
  const { assignments } = standardisation;
  const assignTokenToRole = useProjectStore((s) => s.assignTokenToRole);
  const unassignRole = useProjectStore((s) => s.unassignRole);
  const addToken = useProjectStore((s) => s.addToken);

  const handleAssignToken = useCallback(
    (
      roleKey: string,
      roleSuffix: string,
      token: { name: string; cssVariable?: string; value: string; type?: string }
    ) => {
      const stdName = buildStandardName(standardisation.kitPrefix, roleSuffix);
      // If the token isn't in extractionData yet (e.g. user typed a custom hex in the
      // popover), create it so it persists, exports, and appears in All Tokens.
      const existsInExtraction = allTokens.some(
        (t) => (t.cssVariable ?? t.name) === (token.cssVariable ?? token.name) && t.value === token.value
      );
      if (!existsInExtraction) {
        const cssVar = token.cssVariable ?? `--${token.name}`;
        const tokenType: TokenType =
          (token.type as TokenType | undefined) === "typography" ||
          token.type === "spacing" ||
          token.type === "radius" ||
          token.type === "effect" ||
          token.type === "motion"
            ? (token.type as TokenType)
            : "color";
        addToken(
          projectId,
          {
            name: token.name,
            value: token.value,
            type: tokenType,
            category: "semantic",
            cssVariable: cssVar,
          },
          { assignToRole: { roleKey, standardName: stdName } }
        );
        return;
      }
      assignTokenToRole(projectId, roleKey, token.name, token.cssVariable, token.value, stdName);
    },
    [projectId, standardisation.kitPrefix, assignTokenToRole, addToken, allTokens]
  );

  // Track which category has the inline Add Token form open.
  const [addingToCategory, setAddingToCategory] = useState<StandardRoleCategory | null>(null);

  const handleCreateToken = useCallback(
    (category: StandardRoleCategory, name: string, value: string) => {
      const cleanName = name.trim().replace(/^--/, "");
      if (!cleanName || !value.trim()) return;
      addToken(projectId, {
        name: cleanName,
        value: value.trim(),
        type: TOKEN_TYPE_FOR_CATEGORY[category],
        category: "semantic",
        cssVariable: `--${cleanName}`,
      });
      setAddingToCategory(null);
    },
    [projectId, addToken]
  );

  const handleUnassignRole = useCallback(
    (roleKey: string) => {
      unassignRole(projectId, roleKey);
    },
    [projectId, unassignRole]
  );

  // Compare modal state
  const [compareData, setCompareData] = useState<{
    snapshotMd: string;
    currentMd: string;
  } | null>(null);

  const handleCompare = useCallback(
    (snapshotMd: string, currentMd: string) => {
      setCompareData({ snapshotMd, currentMd });
    },
    []
  );

  // Build a lookup from role key to the actual token.
  // Match by cssVariable/name only — NOT by value. The assignment's value field is
  // a frozen snapshot from assign-time; if the token's value legitimately changes
  // (parser correction, user edit, etc.) we still want the role to resolve.
  const roleTokenMap = useMemo(() => {
    const map = new Map<string, ExtractedToken>();
    for (const [roleKey, assignment] of Object.entries(assignments)) {
      const target = assignment.originalCssVariable ?? assignment.originalName;
      const token = allTokens.find((t) => (t.cssVariable ?? t.name) === target);
      if (token) {
        map.set(roleKey, token);
      }
    }
    return map;
  }, [assignments, allTokens]);

  // Build the full pickable-tokens list for the assign popover.
  // Sources: extractionData tokens (primary) + standardisation.unassigned (anything
  // extra that isn't in extractionData, usually custom hex entries from earlier sessions).
  // Each token is decorated with the role label it's already assigned to (if any) so
  // users can see the implications of reassigning.
  const availableTokens = useMemo(() => {
    const roleToLabel = new Map<string, string>();
    for (const r of STANDARD_SCHEMA.roles) roleToLabel.set(r.key, r.label);

    const valueToRole = new Map<string, string>();
    for (const [roleKey, a] of Object.entries(assignments)) {
      const key = `${a.originalCssVariable ?? a.originalName}::${a.value}`;
      valueToRole.set(key, roleToLabel.get(roleKey) ?? roleKey);
    }

    const items: Array<{
      name: string;
      cssVariable?: string;
      value: string;
      type: string;
      hidden: boolean;
      assignedToRole?: string;
    }> = [];

    for (const t of allTokens) {
      const key = `${t.cssVariable ?? t.name}::${t.value}`;
      items.push({
        name: t.name,
        cssVariable: t.cssVariable,
        value: t.value,
        type: t.type,
        hidden: false,
        assignedToRole: valueToRole.get(key),
      });
    }

    // Also include any unassigned entries that aren't already in extractionData
    // (e.g. custom hex entries from before the persistence fix).
    const seen = new Set(items.map((i) => `${i.cssVariable ?? i.name}::${i.value}`));
    for (const u of standardisation.unassigned) {
      const key = `${u.cssVariable ?? u.name}::${u.value}`;
      if (!seen.has(key)) {
        items.push({ ...u, assignedToRole: valueToRole.get(key) });
        seen.add(key);
      }
    }

    return items;
  }, [allTokens, assignments, standardisation.unassigned]);

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
            <span className="rounded-full border border-[var(--status-success)]/20 bg-[var(--status-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--status-success)]">
              {Object.values(assignments).filter((a) => a.confidence === "high").length} high
            </span>
          )}
          {Object.values(assignments).filter((a) => a.confidence === "medium").length > 0 && (
            <span className="rounded-full border border-[var(--status-warning)]/20 bg-[var(--status-warning)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--status-warning)]">
              {Object.values(assignments).filter((a) => a.confidence === "medium").length} medium
            </span>
          )}
          {Object.values(assignments).filter((a) => a.confidence === "low").length > 0 && (
            <span className="rounded-full border border-[var(--status-error)]/20 bg-[var(--status-error)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--status-error)]">
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
            <div className="mb-4 flex items-center justify-end">
              <button
                onClick={() => setAddingToCategory(addingToCategory === catKey ? null : catKey)}
                className="flex items-center gap-1 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add token
              </button>
            </div>
            {addingToCategory === catKey && (
              <AddTokenForm
                tokenType={TOKEN_TYPE_FOR_CATEGORY[catKey]}
                autoKeepOpen
                onSubmit={(token) =>
                  handleCreateToken(catKey, token.name, token.value)
                }
                onCancel={() => setAddingToCategory(null)}
              />
            )}
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
                      <div className="mt-1 text-center group/role">
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
                            title={`${assignment.confidence} confidence. Click swatch to reassign.`}
                          />
                        )}
                        {!assignment.userConfirmed && (
                          <button
                            onClick={() => handleUnassignRole(role.key)}
                            className="ml-1 inline-block h-3 w-3 rounded-full text-[8px] text-[var(--text-muted)] opacity-0 transition-opacity group-hover/role:opacity-100 hover:text-red-400"
                            title="Unassign this token"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // Empty slot with assign popover
                return (
                  <AssignTokenPopover
                    key={role.key}
                    role={role}
                    availableTokens={availableTokens}
                    onAssign={(token) =>
                      handleAssignToken(role.key, role.suffix, token)
                    }
                  >
                    <div
                      className="flex flex-col items-center gap-2 cursor-pointer group/slot"
                      title={`Click to assign a token to ${role.label}`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-[var(--studio-border)] text-[var(--text-muted)] transition-colors group-hover/slot:border-[var(--studio-border-strong)] group-hover/slot:text-[var(--text-secondary)]">
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
                  </AssignTokenPopover>
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
                const rawNum = token ? parseFloat(token.value) : 0;
                const pxValue = token?.value.includes("rem") ? rawNum * 16 : rawNum;

                return (
                  <div
                    key={role.key}
                    className={`group flex items-center gap-3 rounded-md px-3 py-2 ${
                      assignment ? "hover:bg-[var(--bg-hover)]" : "opacity-40"
                    }`}
                  >
                    {/* Visual indicator */}
                    {catKey === "spacing" && token && (
                      <div
                        className="h-3 shrink-0 rounded-sm bg-[var(--studio-accent)]"
                        style={{ width: `${Math.min(pxValue || 4, 64)}px`, minWidth: "4px" }}
                      />
                    )}
                    {catKey === "radius" && token && (
                      <div
                        className="h-5 w-5 shrink-0 border-2 border-[var(--studio-accent)] bg-transparent"
                        style={{ borderRadius: token.value }}
                      />
                    )}
                    {catKey === "typography" && token && (
                      <span
                        className="w-5 shrink-0 text-center text-sm font-bold text-[var(--text-secondary)]"
                        style={token.value.includes(",") ? { fontFamily: token.value } : {}}
                      >
                        Aa
                      </span>
                    )}

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
                className="rounded-md border border-[var(--status-warning)]/30 bg-[var(--bg-surface)] px-3 py-2"
              >
                <p className="text-xs font-medium text-[var(--status-warning)]">{ap.rule}</p>
                <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{ap.reason}</p>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">{ap.fix}</p>
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

      {/* Version History & Snapshots */}
      <div className="mt-4">
        <SnapshotManager
          projectId={projectId}
          snapshots={snapshots}
          currentLayoutMd={currentLayoutMd}
          onCompare={handleCompare}
        />
      </div>

      {/* Compare Modal */}
      {compareData && (
        <LayoutMdCompareModal
          snapshotLayoutMd={compareData.snapshotMd}
          currentLayoutMd={compareData.currentMd}
          onClose={() => setCompareData(null)}
        />
      )}
    </div>
  );
}

