"use client";

import { useMemo, useState, useCallback } from "react";
import { Plus, Sun, Moon } from "lucide-react";
import type { ExtractedToken, ProjectStandardisation, DesignSystemSnapshot, TokenType } from "@/lib/types";
import {
  SCHEMA_CATEGORIES,
  getRolesByCategory,
  STANDARD_SCHEMA,
  type StandardRole,
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
import { assignmentKey } from "@/lib/tokens/assignment-key";

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
  const updateStandardisation = useProjectStore((s) => s.updateStandardisation);

  // Mode awareness. Any project that extracted tokens tagged with a non-
  // default mode (typically "dark") gets a mode toggle so users can curate
  // each mode's role assignments independently. Projects without mode
  // variants get the old single-view experience.
  const availableModes = useMemo(() => {
    const modes = new Set<string>();
    for (const t of allTokens) {
      if (t.mode) modes.add(t.mode);
    }
    // Also surface modes already present in assignments (e.g. dark-only kits
    // where every dark token has been assigned and removed from the
    // unassigned list).
    for (const a of Object.values(assignments)) {
      if (a.mode) modes.add(a.mode);
    }
    return [...modes].sort();
  }, [allTokens, assignments]);
  const hasModes = availableModes.length > 0;
  const [activeMode, setActiveMode] = useState<string | undefined>(undefined);

  // When activeMode changes, the set of "visible" assignments is the subset
  // whose `.mode` matches. Default mode (undefined) shows assignments
  // without a mode field — the legacy single-mode behaviour.
  const visibleAssignments = useMemo(() => {
    const filtered: ProjectStandardisation["assignments"] = {};
    for (const [key, a] of Object.entries(assignments)) {
      if ((a.mode ?? undefined) === activeMode) {
        filtered[key] = a;
      }
    }
    return filtered;
  }, [assignments, activeMode]);

  const dismissAntiPattern = useCallback(
    (rule: string) => {
      const existing = standardisation.dismissedAntiPatterns ?? [];
      if (existing.includes(rule)) return;
      updateStandardisation(projectId, {
        ...standardisation,
        dismissedAntiPatterns: [...existing, rule],
      });
    },
    [projectId, standardisation, updateStandardisation]
  );

  const scrollToLayoutMdSection = useCallback((match: string) => {
    window.dispatchEvent(
      new CustomEvent("layout-scroll-to-section", { detail: { match } })
    );
  }, []);

  const visibleAntiPatterns = useMemo(() => {
    const dismissed = new Set(standardisation.dismissedAntiPatterns ?? []);
    return standardisation.antiPatterns.filter((ap) => !dismissed.has(ap.rule));
  }, [standardisation.antiPatterns, standardisation.dismissedAntiPatterns]);

  const handleAssignToken = useCallback(
    (
      roleKey: string,
      roleSuffix: string,
      token: { name: string; cssVariable?: string; value: string; type?: string; mode?: string }
    ) => {
      const stdName = buildStandardName(standardisation.kitPrefix, roleSuffix);
      // Target mode = whichever mode the user is curating right now. Falls
      // back to the token's own mode tag if present (e.g. a dark-tagged
      // token dragged onto an otherwise-empty light slot — which we still
      // treat as a light-mode assignment; the token's mode is informational).
      const targetMode = activeMode;
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
            mode: token.mode,
          },
          { assignToRole: { roleKey, standardName: stdName, mode: targetMode } }
        );
        return;
      }
      assignTokenToRole(projectId, roleKey, token.name, token.cssVariable, token.value, stdName, targetMode);
    },
    [projectId, standardisation.kitPrefix, assignTokenToRole, addToken, allTokens, activeMode]
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
      unassignRole(projectId, roleKey, activeMode);
    },
    [projectId, unassignRole, activeMode]
  );

  // When the user switches to dark mode on a project that has no dark
  // assignments yet, seeding them from the light-mode assignments is far
  // less tedious than building each role manually. For each light
  // assignment, prefer a same-name token whose `.mode` matches the target
  // (so if the extractor captured --color-bg #fff light + #000 dark, dark
  // mode starts with #000). Falls back to the light token when no dark
  // twin exists — the user can then swap it manually.
  const handleCopyFromDefault = useCallback(() => {
    if (!activeMode) return;
    const lightAssignments = Object.values(assignments).filter((a) => !a.mode);
    for (const a of lightAssignments) {
      const target = a.originalCssVariable ?? a.originalName;
      const sameName = allTokens.filter((t) => (t.cssVariable ?? t.name) === target);
      const token = sameName.find((t) => t.mode === activeMode) ?? sameName[0];
      if (!token) continue;
      assignTokenToRole(
        projectId,
        a.roleKey,
        token.name,
        token.cssVariable,
        token.value,
        a.standardName,
        activeMode
      );
    }
  }, [activeMode, assignments, allTokens, projectId, assignTokenToRole]);

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

  // Build a lookup from role key to the actual token, scoped to the
  // currently-visible mode. Match by cssVariable/name only — NOT by value —
  // because assignment.value is a frozen snapshot from assign-time; if the
  // underlying token's value legitimately changes (parser correction, user
  // edit) we still want the role to resolve. When a dark-mode assignment
  // points at a token whose mode-scoped twin exists, prefer the twin so the
  // rendered swatch shows the dark value, not the light one.
  const roleTokenMap = useMemo(() => {
    const map = new Map<string, ExtractedToken>();
    for (const assignment of Object.values(visibleAssignments)) {
      const target = assignment.originalCssVariable ?? assignment.originalName;
      const matches = allTokens.filter((t) => (t.cssVariable ?? t.name) === target);
      // Prefer a token whose mode matches the active mode (if any).
      const token =
        matches.find((t) => (t.mode ?? undefined) === activeMode) ?? matches[0];
      if (token) {
        map.set(assignment.roleKey, token);
      }
    }
    return map;
  }, [visibleAssignments, allTokens, activeMode]);

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

  // Count assigned roles per category — for the currently-visible mode only,
  // so the badge ratios reflect what the user is actually curating.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { assigned: number; total: number }> = {};
    const assignedRoleKeys = new Set(
      Object.values(visibleAssignments).map((a) => a.roleKey)
    );
    for (const cat of SCHEMA_CATEGORIES) {
      const roles = getRolesByCategory(cat.key);
      const assigned = roles.filter((r) => assignedRoleKeys.has(r.key)).length;
      counts[cat.key] = { assigned, total: roles.length };
    }
    return counts;
  }, [visibleAssignments]);

  // Only show colour categories for now (the main value)
  const colourCategories: StandardRoleCategory[] = ["backgrounds", "text", "borders", "accent", "status"];

  return (
    <div className="space-y-8">
      <ArchitectureHelp projectId={projectId} layoutMd={currentLayoutMd} />

      {/* Stats banner */}
      <div className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-primary)]">
            Curated Design System
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
            {Object.values(visibleAssignments).length} tokens mapped to standard roles
            {activeMode ? ` for ${activeMode} mode` : ""}
            {"."}
            {standardisation.unassigned.filter((u) => !u.hidden).length > 0 && (
              <> {standardisation.unassigned.filter((u) => !u.hidden).length} unassigned.</>
            )}
          </p>
        </div>
        {/* When the user is curating a non-default mode and has no
            assignments for it yet, offer a one-click bootstrap from the
            light assignments. Mode-tagged tokens override light values
            automatically where available. */}
        {activeMode && Object.values(visibleAssignments).length === 0 &&
          Object.values(assignments).some((a) => !a.mode) && (
            <button
              onClick={handleCopyFromDefault}
              className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              title={`Start ${activeMode} assignments from the light set. Any token with a ${activeMode} variant uses that instead.`}
            >
              Copy from Light
            </button>
          )}
        {/* Mode toggle — only rendered when the project has mode variants. */}
        {hasModes && (
          <div className="flex items-center rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] p-0.5">
            <button
              onClick={() => setActiveMode(undefined)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                activeMode === undefined
                  ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
              title="Light / default mode"
            >
              <Sun className="h-3 w-3" />
              Light
            </button>
            {availableModes.map((m) => (
              <button
                key={m}
                onClick={() => setActiveMode(m)}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                  activeMode === m
                    ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
                title={`${m} mode assignments`}
              >
                {m === "dark" ? <Moon className="h-3 w-3" /> : null}
                <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>
        )}
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
            subtitle={`of ${counts.total} roles`}
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
              <InlineAddTokenForm
                category={catKey}
                availableTokens={allTokens}
                onSubmit={(name, value) => handleCreateToken(catKey, name, value)}
                onCancel={() => setAddingToCategory(null)}
              />
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
              {roles.map((role) => {
                const assignment = visibleAssignments[assignmentKey(role.key, activeMode)];
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
                        reassign={{
                          role,
                          availableTokens,
                          onAssign: (picked) =>
                            handleAssignToken(role.key, role.suffix, picked),
                        }}
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

      {/* Non-colour categories: typography, spacing, radius, shadows, motion */}
      {/* Render even when empty so blank projects see the full schema and */}
      {/* can add tokens via the per-section Add button, matching colour categories. */}
      {(["typography", "spacing", "radius", "shadows", "motion"] as StandardRoleCategory[]).map((catKey) => {
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
            subtitle={`of ${counts.total} roles`}
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
              <InlineAddTokenForm
                category={catKey}
                availableTokens={allTokens}
                onSubmit={(name, value) => handleCreateToken(catKey, name, value)}
                onCancel={() => setAddingToCategory(null)}
              />
            )}
            <div className="space-y-1">
              {roles.map((role) => {
                const assignment = assignments[role.key];
                const token = roleTokenMap.get(role.key);
                const rawNum = token ? parseFloat(token.value) : 0;
                const pxValue = token?.value.includes("rem") ? rawNum * 16 : rawNum;

                const rowInner = (
                  <div
                    className={`group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-[var(--bg-hover)] ${
                      assignment ? "" : "border border-dashed border-[var(--studio-border)]"
                    }`}
                    title={assignment ? `${role.label}. Click to reassign.` : `Click to assign a token to ${role.label}`}
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
                        className="flex h-9 w-12 shrink-0 items-center justify-center rounded bg-[var(--bg-surface)] text-lg leading-none text-[var(--text-primary)]"
                        style={
                          // When the token value looks like a font stack (has commas or quotes), render the preview in it.
                          /[,"']/.test(token.value)
                            ? { fontFamily: token.value }
                            : {}
                        }
                      >
                        Ag
                      </span>
                    )}
                    {catKey === "shadows" && token && (
                      <div
                        className="h-6 w-6 shrink-0 rounded-md bg-[var(--bg-surface)]"
                        style={{ boxShadow: token.value }}
                      />
                    )}
                    {catKey === "motion" && token && (
                      <span className="w-5 shrink-0 text-center text-xs text-[var(--text-muted)]">

                      </span>
                    )}
                    {!token && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-dashed border-[var(--studio-border)] text-[var(--text-muted)]">
                        <span className="text-sm">+</span>
                      </div>
                    )}

                    <span className="w-28 shrink-0 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {role.label}
                    </span>
                    {token ? (
                      <>
                        <code className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--text-secondary)]">
                          {token.cssVariable ?? `--${token.name}`}
                        </code>
                        <code className="shrink-0 font-mono text-xs text-[var(--text-muted)]">
                          {token.value.length > 40 ? token.value.slice(0, 40) + "…" : token.value}
                        </code>
                        {assignment && assignment.confidence !== "high" && (
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              assignment.confidence === "medium"
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                            title={`${assignment.confidence} confidence. Click row to reassign.`}
                          />
                        )}
                        {assignment && !assignment.userConfirmed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassignRole(role.key);
                            }}
                            className="h-4 w-4 shrink-0 rounded-full text-xs text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                            title="Unassign this token"
                          >
                            ×
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] italic">
                        click to assign
                        {role.required && (
                          <span className="ml-1 text-[10px] opacity-60">(required)</span>
                        )}
                      </span>
                    )}
                  </div>
                );

                return (
                  <AssignTokenPopover
                    key={role.key}
                    role={role}
                    availableTokens={availableTokens}
                    onAssign={(token) =>
                      handleAssignToken(role.key, role.suffix, token)
                    }
                  >
                    {rowInner}
                  </AssignTokenPopover>
                );
              })}
            </div>

            {catKey === "typography" && (
              <TypographySpecimen roleTokenMap={roleTokenMap} />
            )}
            {catKey === "shadows" && (
              <ElevationSpecimen roleTokenMap={roleTokenMap} />
            )}
            {catKey === "spacing" && (
              <SpacingRamp roleTokenMap={roleTokenMap} roles={roles} />
            )}
            {catKey === "radius" && (
              <RadiusSpecimen roleTokenMap={roleTokenMap} roles={roles} />
            )}
            {catKey === "motion" && (
              <MotionSpecimen roleTokenMap={roleTokenMap} roles={roles} />
            )}
          </DesignSystemSection>
        );
      })}

      {/* Anti-patterns */}
      {standardisation.antiPatterns.length > 0 && (
        <DesignSystemSection
          id="curated-antipatterns"
          title="Anti-Patterns Detected"
          count={visibleAntiPatterns.length}
        >
          <div className="space-y-3">
            {visibleAntiPatterns.map((ap, i) => (
              <div
                key={`${ap.rule}-${i}`}
                className="group rounded-md border border-[var(--status-warning)]/30 bg-[var(--bg-surface)] px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-xs font-medium text-[var(--status-warning)]">{ap.rule}</p>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => scrollToLayoutMdSection("anti.?patterns|constraints")}
                      className="rounded px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                      title="Open the anti-patterns section in the layout.md editor"
                    >
                      Fix in layout.md
                    </button>
                    <button
                      onClick={() => dismissAntiPattern(ap.rule)}
                      className="rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                      title="Hide this anti-pattern until re-standardisation"
                    >
                      Hide
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{ap.reason}</p>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">{ap.fix}</p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              {(standardisation.dismissedAntiPatterns ?? []).length > 0 && (
                <button
                  onClick={() =>
                    updateStandardisation(projectId, {
                      ...standardisation,
                      dismissedAntiPatterns: [],
                    })
                  }
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Restore {(standardisation.dismissedAntiPatterns ?? []).length} dismissed
                </button>
              )}
              <button
                onClick={() => scrollToLayoutMdSection("anti.?patterns|constraints")}
                className="ml-auto rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                Add anti-pattern manually in layout.md
              </button>
            </div>
          </div>
        </DesignSystemSection>
      )}

      {/* Unassigned tokens */}
      {standardisation.unassigned.length > 0 && (
        <UnassignedTokensSection
          projectId={projectId}
          standardisation={standardisation}
          updateStandardisation={updateStandardisation}
        />
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

function InlineAddTokenForm({
  category,
  availableTokens,
  onSubmit,
  onCancel,
}: {
  category: StandardRoleCategory;
  availableTokens: ExtractedToken[];
  onSubmit: (name: string, value: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isColor = TOKEN_TYPE_FOR_CATEGORY[category] === "color";
  const canSubmit = name.trim().length > 0 && value.trim().length > 0;
  const colourPreview = isColor && /^#([0-9a-f]{3}|[0-9a-f]{6,8})$/i.test(value.trim());
  const expectedType = TOKEN_TYPE_FOR_CATEGORY[category];

  // Filter available tokens to the right type for this category.
  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    let list = availableTokens.filter((t) => t.type === expectedType);
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.cssVariable ?? "").toLowerCase().includes(q) ||
          t.value.toLowerCase().includes(q)
      );
    }
    // Dedupe by cssVariable/name + value
    const seen = new Set<string>();
    return list
      .filter((t) => {
        const key = `${t.cssVariable ?? t.name}::${t.value}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }, [availableTokens, expectedType, name]);

  const placeholder =
    expectedType === "color"
      ? "#e4f222"
      : expectedType === "spacing"
      ? "16px"
      : expectedType === "radius"
      ? "8px"
      : expectedType === "typography"
      ? 'Inter, sans-serif'
      : expectedType === "effect"
      ? "0 1px 2px rgba(0,0,0,0.1)"
      : expectedType === "motion"
      ? "200ms"
      : "value";

  const applySuggestion = (t: ExtractedToken) => {
    setName(t.name);
    setValue(t.value);
    setShowSuggestions(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(name, value);
      }}
      className="relative mb-4 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-2"
    >
      <div className="flex items-center gap-2">
        {isColor && (
          <input
            type="color"
            value={colourPreview ? value.trim() : "#6366f1"}
            onChange={(e) => setValue(e.target.value)}
            className="h-7 w-7 shrink-0 cursor-pointer rounded border border-[var(--studio-border)] bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
            title="Pick a colour"
          />
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="token-name (or pick from extracted below)"
          autoFocus
          className="min-w-0 flex-1 rounded bg-[var(--bg-elevated)] px-2 py-1 font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border border-transparent focus:border-[var(--studio-border-focus)]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded bg-[var(--bg-elevated)] px-2 py-1 font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border border-transparent focus:border-[var(--studio-border-focus)]"
        />
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded bg-[var(--studio-accent)] px-3 py-1 text-[11px] font-medium text-[var(--text-on-accent)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-2 right-2 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] shadow-lg">
          <div className="border-b border-[var(--studio-border)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Extracted {expectedType} tokens ({suggestions.length})
          </div>
          {suggestions.map((t) => (
            <button
              key={`${t.cssVariable ?? t.name}::${t.value}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                applySuggestion(t);
              }}
              className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[var(--bg-hover)] transition-colors"
            >
              {expectedType === "color" && /^#([0-9a-f]{3}|[0-9a-f]{6,8})$/i.test(t.value) && (
                <span
                  className="h-4 w-4 shrink-0 rounded border border-[var(--studio-border)]"
                  style={{ backgroundColor: t.value }}
                />
              )}
              {expectedType === "typography" && (
                <span
                  className="w-5 shrink-0 text-center text-sm font-semibold text-[var(--text-secondary)]"
                  style={t.value.includes(",") ? { fontFamily: t.value } : {}}
                >
                  Aa
                </span>
              )}
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--text-primary)]">
                {t.cssVariable ?? `--${t.name}`}
              </code>
              <code className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                {t.value.length > 30 ? t.value.slice(0, 30) + "…" : t.value}
              </code>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

// ─── Specimens ──────────────────────────────────────────────────────────────

/**
 * Typography specimens: family rows, size scale, weight scale, line-height scale.
 * Every block renders against the current surface so the sample matches what
 * agents actually produce in generated UI.
 */
function TypographySpecimen({
  roleTokenMap,
}: {
  roleTokenMap: Map<string, ExtractedToken>;
}) {
  const families = [
    { key: "font-sans", label: "Sans" },
    { key: "font-serif", label: "Serif" },
    { key: "font-mono", label: "Mono" },
  ]
    .map((f) => ({ ...f, token: roleTokenMap.get(f.key) }))
    .filter((f) => f.token && /[,"']/.test(f.token.value));

  const sizeRoles = ["font-size-xs", "font-size-sm", "font-size-md", "font-size-lg", "font-size-xl", "font-size-2xl", "font-size-3xl"];
  const sizes = sizeRoles
    .map((key) => ({ key, token: roleTokenMap.get(key) }))
    .filter((s) => s.token);

  const weightRoles = ["font-weight-regular", "font-weight-medium", "font-weight-semibold", "font-weight-bold"];
  const weights = weightRoles
    .map((key) => ({ key, token: roleTokenMap.get(key) }))
    .filter((w) => w.token);

  const lineHeightRoles = ["line-height-tight", "line-height-normal", "line-height-loose"];
  const lineHeights = lineHeightRoles
    .map((key) => ({ key, token: roleTokenMap.get(key) }))
    .filter((l) => l.token);

  const defaultFamily = families[0]?.token?.value;
  const anyFilled = families.length > 0 || sizes.length > 0 || weights.length > 0 || lineHeights.length > 0;
  if (!anyFilled) return null;

  return (
    <div className="mt-4 space-y-6 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      {/* Family specimens */}
      {families.length > 0 && (
        <div className="space-y-4">
          {families.map((f) => (
            <div key={f.key} className="space-y-1">
              <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {f.label} — {f.token!.cssVariable ?? `--${f.token!.name}`}
              </div>
              <div
                className="text-2xl leading-tight text-[var(--text-primary)]"
                style={{ fontFamily: f.token!.value }}
              >
                The quick brown fox jumps over the lazy dog
              </div>
              <div
                className="text-sm text-[var(--text-secondary)]"
                style={{ fontFamily: f.token!.value }}
              >
                Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz · 0 1 2 3 4 5 6 7 8 9
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Size scale table */}
      {sizes.length > 0 && (
        <div className="space-y-3 border-t border-[var(--studio-border)] pt-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Size scale</div>
          <div className="space-y-2">
            {sizes.map(({ key, token }) => (
              <div key={key} className="flex items-baseline gap-4">
                <div
                  className="min-w-0 flex-1 leading-tight text-[var(--text-primary)]"
                  style={{ fontFamily: defaultFamily, fontSize: token!.value }}
                >
                  The quick brown fox
                </div>
                <div className="shrink-0 text-right">
                  <code className="block font-mono text-[10px] text-[var(--text-secondary)]">
                    {token!.cssVariable ?? `--${token!.name}`}
                  </code>
                  <code className="block font-mono text-[10px] text-[var(--text-muted)]">{token!.value}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weight specimens */}
      {weights.length > 0 && (
        <div className="space-y-3 border-t border-[var(--studio-border)] pt-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Weight scale</div>
          <div className="flex flex-wrap gap-6">
            {weights.map(({ key, token }) => (
              <div key={key} className="space-y-1">
                <div
                  className="text-2xl leading-tight text-[var(--text-primary)]"
                  style={{ fontFamily: defaultFamily, fontWeight: token!.value as React.CSSProperties["fontWeight"] }}
                >
                  Aa Grotesque
                </div>
                <code className="block font-mono text-[10px] text-[var(--text-muted)]">
                  {token!.cssVariable ?? `--${token!.name}`} · {token!.value}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line-height specimens */}
      {lineHeights.length > 0 && (
        <div className="space-y-3 border-t border-[var(--studio-border)] pt-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Line-height scale</div>
          <div className="grid gap-4 md:grid-cols-3">
            {lineHeights.map(({ key, token }) => (
              <div key={key} className="space-y-1">
                <div
                  className="text-sm text-[var(--text-primary)]"
                  style={{ fontFamily: defaultFamily, lineHeight: token!.value }}
                >
                  Design tokens travel from layout.md to every coding agent. Keep them tight, explicit, and canonical so generated UI stays on-brand.
                </div>
                <code className="block font-mono text-[10px] text-[var(--text-muted)]">
                  {token!.cssVariable ?? `--${token!.name}`} · {token!.value}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Elevation gallery: real cards on a surface, one per shadow role. */
function ElevationSpecimen({
  roleTokenMap,
}: {
  roleTokenMap: Map<string, ExtractedToken>;
}) {
  const shadowRoles = ["shadow-sm", "shadow-md", "shadow-lg"];
  const filled = shadowRoles
    .map((key) => ({ key, token: roleTokenMap.get(key) }))
    .filter((s) => s.token);
  if (filled.length === 0) return null;

  return (
    <div className="mt-4 rounded-md border border-[var(--studio-border)] bg-[var(--bg-app)] p-6">
      <div className="mb-4 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Elevation</div>
      <div className="flex flex-wrap gap-6">
        {filled.map(({ key, token }) => (
          <div key={key} className="space-y-2">
            <div
              className="h-20 w-36 rounded-lg bg-[var(--bg-surface)]"
              style={{ boxShadow: token!.value }}
            />
            <div>
              <code className="block font-mono text-[10px] text-[var(--text-secondary)]">
                {token!.cssVariable ?? `--${token!.name}`}
              </code>
              <code className="block max-w-[200px] truncate font-mono text-[10px] text-[var(--text-muted)]" title={token!.value}>
                {token!.value}
              </code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Spacing ramp: proportional horizontal bars stacked by size. */
function SpacingRamp({
  roleTokenMap,
  roles,
}: {
  roleTokenMap: Map<string, ExtractedToken>;
  roles: StandardRole[];
}) {
  const filled = roles
    .map((r) => ({ role: r, token: roleTokenMap.get(r.key) }))
    .filter((r) => r.token);
  if (filled.length === 0) return null;

  const MAX_BAR = 240;
  const values = filled.map(({ token }) => {
    const n = parseFloat(token!.value);
    return token!.value.includes("rem") ? n * 16 : n;
  });
  const maxPx = Math.max(...values, 4);

  return (
    <div className="mt-4 space-y-2 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Spacing ramp</div>
      {filled.map(({ role, token }, i) => {
        const px = values[i];
        const width = Math.min(px, MAX_BAR) * (MAX_BAR / Math.max(maxPx, MAX_BAR));
        const overflowed = px > MAX_BAR;
        return (
          <div key={role.key} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {role.label.replace("Extra ", "").replace(" Radius", "")}
            </span>
            <div
              className="h-3 rounded-sm bg-[var(--studio-accent)]"
              style={{ width: `${Math.max(width, 4)}px` }}
            />
            <code className="font-mono text-[10px] text-[var(--text-muted)]">
              {token!.value}
              {overflowed && " (bar capped)"}
            </code>
            <code className="font-mono text-[9px] text-[var(--text-muted)] opacity-70">
              {token!.cssVariable ?? `--${token!.name}`}
            </code>
          </div>
        );
      })}
    </div>
  );
}

/** Radius specimens: side-by-side 120×60 rectangles. */
function RadiusSpecimen({
  roleTokenMap,
  roles,
}: {
  roleTokenMap: Map<string, ExtractedToken>;
  roles: StandardRole[];
}) {
  const filled = roles
    .map((r) => ({ role: r, token: roleTokenMap.get(r.key) }))
    .filter((r) => r.token);
  if (filled.length === 0) return null;

  return (
    <div className="mt-4 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Radius</div>
      <div className="flex flex-wrap gap-6">
        {filled.map(({ role, token }) => (
          <div key={role.key} className="space-y-2">
            <div
              className="h-15 w-30 border border-[var(--studio-border)] bg-[var(--bg-elevated)]"
              style={{ borderRadius: token!.value, height: 60, width: 120 }}
            />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {role.label}
              </div>
              <code className="block font-mono text-[10px] text-[var(--text-secondary)]">
                {token!.cssVariable ?? `--${token!.name}`}
              </code>
              <code className="block font-mono text-[10px] text-[var(--text-muted)]">{token!.value}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Motion specimens: pulsing dots for durations, sliding dots for easing curves. */
function MotionSpecimen({
  roleTokenMap,
  roles,
}: {
  roleTokenMap: Map<string, ExtractedToken>;
  roles: StandardRole[];
}) {
  const filled = roles
    .map((r) => ({ role: r, token: roleTokenMap.get(r.key) }))
    .filter((r) => r.token);
  if (filled.length === 0) return null;

  return (
    <div className="mt-4 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      <style>{`
        @keyframes layout-motion-pulse { 0%, 40%, 100% { transform: scale(1); opacity: 0.6; } 20% { transform: scale(1.6); opacity: 1; } }
        @keyframes layout-motion-glide { 0% { transform: translateX(0); } 100% { transform: translateX(160px); } }
      `}</style>
      <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Motion</div>
      <div className="flex flex-wrap gap-8">
        {filled.map(({ role, token }) => {
          const isDuration = role.key.startsWith("duration");
          const isEasing = role.key.startsWith("ease") || role.key.includes("easing");
          return (
            <div key={role.key} className="space-y-2">
              {isDuration && (
                <div className="flex h-6 items-center">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-[var(--studio-accent)]"
                    style={{
                      animation: `layout-motion-pulse ${token!.value} ease-in-out infinite`,
                    }}
                  />
                </div>
              )}
              {isEasing && (
                <div className="relative h-6 w-44 overflow-hidden rounded-sm bg-[var(--bg-elevated)]">
                  <span
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--studio-accent)]"
                    style={{
                      animationName: "layout-motion-glide",
                      animationDuration: "1.4s",
                      animationIterationCount: "infinite",
                      animationTimingFunction: token!.value,
                      animationDirection: "alternate",
                    }}
                  />
                </div>
              )}
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {role.label}
                </div>
                <code className="block font-mono text-[10px] text-[var(--text-secondary)]">
                  {token!.cssVariable ?? `--${token!.name}`}
                </code>
                <code className="block font-mono text-[10px] text-[var(--text-muted)]">{token!.value}</code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Unassigned tokens: grouped + searchable + bulk hide ────────────────────

const NOISE_PATTERNS: { label: string; test: (name: string, value: string) => boolean }[] = [
  {
    label: "numeric tints (e.g. --white-100, --gray-500)",
    test: (name) => /^--?(white|black|gray|grey|neutral|slate|zinc|stone)-\d{2,4}\b/i.test(name),
  },
  {
    label: "rgba alpha primitives (rgba(var(--…)))",
    test: (_name, value) => /^rgba\(\s*var\(--/i.test(value),
  },
  {
    label: "vendor-prefix tokens (chakra-, mantine-, radix-, shadcn-, ant-, mui-, fides-)",
    test: (name) => /^--?(chakra|mantine|radix|shadcn|ant|mui|fides|onetrust|iubenda|cookiebot|hotjar|intercom)[-_]/i.test(name),
  },
];

function UnassignedTokensSection({
  projectId,
  standardisation,
  updateStandardisation,
}: {
  projectId: string;
  standardisation: ProjectStandardisation;
  updateStandardisation: (id: string, data: ProjectStandardisation) => void;
}) {
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => standardisation.unassigned.filter((u) => !u.hidden),
    [standardisation.unassigned]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return visible;
    const q = search.toLowerCase();
    return visible.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.cssVariable ?? "").toLowerCase().includes(q) ||
        u.value.toLowerCase().includes(q)
    );
  }, [visible, search]);

  const groups = useMemo(() => {
    const buckets: Record<string, typeof filtered> = {};
    for (const u of filtered) {
      const key = u.type || "other";
      (buckets[key] ??= []).push(u);
    }
    const order = ["color", "typography", "spacing", "radius", "effect", "motion", "other"];
    return order
      .filter((k) => buckets[k] && buckets[k].length > 0)
      .map((k) => ({ type: k, items: buckets[k] }));
  }, [filtered]);

  const updateUnassigned = useCallback(
    (next: ProjectStandardisation["unassigned"]) => {
      updateStandardisation(projectId, { ...standardisation, unassigned: next });
    },
    [projectId, standardisation, updateStandardisation]
  );

  const hideOne = (target: ProjectStandardisation["unassigned"][number]) => {
    const key = `${target.cssVariable ?? target.name}::${target.value}`;
    updateUnassigned(
      standardisation.unassigned.map((u) =>
        `${u.cssVariable ?? u.name}::${u.value}` === key ? { ...u, hidden: true } : u
      )
    );
  };

  const hideByPattern = (test: (name: string, value: string) => boolean) => {
    updateUnassigned(
      standardisation.unassigned.map((u) =>
        test(u.cssVariable ?? u.name, u.value) ? { ...u, hidden: true } : u
      )
    );
  };

  const restoreAllHidden = () => {
    updateUnassigned(standardisation.unassigned.map((u) => ({ ...u, hidden: false })));
  };

  const hiddenCount = standardisation.unassigned.length - visible.length;

  return (
    <DesignSystemSection
      id="curated-unassigned"
      title="Unassigned Tokens"
      count={visible.length}
    >
      <p className="mb-3 text-[10px] text-[var(--text-muted)]">
        Extracted tokens not yet mapped to a standard role. They still appear in All Tokens and layout.md&apos;s Appendix A. Hide noise here to keep the curated view focused.
      </p>

      <div className="mb-3 space-y-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search unassigned tokens…"
          className="w-full rounded bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border border-transparent focus:border-[var(--studio-border-focus)]"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)]">Quick hide:</span>
          {NOISE_PATTERNS.map((p) => {
            const matchCount = visible.filter((u) => p.test(u.cssVariable ?? u.name, u.value)).length;
            if (matchCount === 0) return null;
            return (
              <button
                key={p.label}
                onClick={() => hideByPattern(p.test)}
                className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                title={p.label}
              >
                Hide {matchCount} {p.label.split(" ")[0]}
              </button>
            );
          })}
          {hiddenCount > 0 && (
            <button
              onClick={restoreAllHidden}
              className="ml-auto rounded-md border border-[var(--studio-border)] bg-transparent px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Restore {hiddenCount} hidden
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 && (
        <p className="text-[11px] text-[var(--text-muted)] italic">No unassigned tokens match &quot;{search}&quot;.</p>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const collapsed = collapsedGroups.has(group.type);
          return (
            <div key={group.type} className="space-y-1">
              <button
                onClick={() => {
                  const next = new Set(collapsedGroups);
                  if (next.has(group.type)) next.delete(group.type);
                  else next.add(group.type);
                  setCollapsedGroups(next);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <span>{collapsed ? "▶" : "▼"}</span>
                <span>{group.type}</span>
                <span className="text-[var(--text-muted)] opacity-70">({group.items.length})</span>
              </button>
              {!collapsed && (
                <div className="space-y-0.5">
                  {group.items.map((u, i) => (
                    <div
                      key={`${u.cssVariable ?? u.name}-${i}`}
                      className="group flex items-center gap-3 rounded px-2 py-1 text-xs hover:bg-[var(--bg-hover)]"
                    >
                      {u.type === "color" && (
                        <div
                          className="h-4 w-4 shrink-0 rounded border border-[var(--studio-border)]"
                          style={{ backgroundColor: u.value }}
                        />
                      )}
                      <code className="font-mono text-[var(--text-secondary)]">{u.cssVariable ?? u.name}</code>
                      <code className="min-w-0 flex-1 truncate font-mono text-[var(--text-muted)]" title={u.value}>
                        {u.value}
                      </code>
                      <button
                        onClick={() => hideOne(u)}
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                        title="Hide from curated view"
                      >
                        Hide
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DesignSystemSection>
  );
}

// ─── Architecture help panel ────────────────────────────────────────────────

function ArchitectureHelp({
  projectId,
  layoutMd,
}: {
  projectId: string;
  layoutMd: string;
}) {
  const storageKey = `ds-help-dismissed:${projectId}`;
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) === "1";
  });
  const [expanded, setExpanded] = useState(false);

  // Extract layout.md's Quick Reference section for the "What the AI sees" preview.
  const quickReferencePreview = useMemo(() => {
    const qrMatch = layoutMd.match(/##\s*0\.\s*Quick\s+Reference\b([\s\S]*?)(?=\n##\s+\d+\.|$)/i);
    if (!qrMatch) return null;
    const body = qrMatch[1].trim();
    // Cap at first 40 lines for the preview.
    const lines = body.split("\n").slice(0, 40);
    const truncated = body.split("\n").length > 40;
    return lines.join("\n") + (truncated ? "\n\n…" : "");
  }, [layoutMd]);

  if (dismissed) {
    return (
      <button
        onClick={() => {
          setDismissed(false);
          if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
        }}
        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        Show how the design system works
      </button>
    );
  }

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, "1");
  };

  return (
    <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          <p className="text-xs font-medium text-[var(--text-primary)]">
            How this page feeds your coding agents
          </p>
          <p>
            <strong className="text-[var(--text-primary)]">Curated tokens</strong>{" "}
            are the canonical ~25–30 roles your AI coding agents and Explorer
            see first. They become the{" "}
            <code className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 font-mono text-[10px]">
              CORE TOKENS
            </code>{" "}
            block of <code className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 font-mono text-[10px]">layout.md</code>,
            the default response of the MCP{" "}
            <code className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 font-mono text-[10px]">
              get_tokens
            </code>{" "}
            tool, and the content of the exported tokens.css / tokens.json /
            tailwind.config.
          </p>
          <p>
            <strong className="text-[var(--text-primary)]">All Tokens</strong>{" "}
            (Source Panel) shows every extracted token — reference material
            that appears in layout.md&apos;s Appendix A but is not the primary
            signal to the AI.
          </p>
          <p>
            <strong className="text-[var(--text-primary)]">Explorer</strong>{" "}
            sends the full layout.md (freshly fetched from the server) plus
            Storybook component context and the layout digest to Claude when
            generating variants.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          title="Dismiss"
        >
          ×
        </button>
      </div>

      {quickReferencePreview && (
        <div className="mt-3 border-t border-[var(--studio-border)] pt-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>{expanded ? "▼" : "▶"}</span>
            What the AI sees (Quick Reference, first 40 lines)
          </button>
          {expanded && (
            <pre className="mt-2 max-h-80 overflow-y-auto rounded border border-[var(--studio-border)] bg-[var(--bg-app)] p-3 font-mono text-[10px] leading-relaxed text-[var(--text-secondary)]">
              {quickReferencePreview}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
