"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import type { StandardRole, StandardRoleCategory } from "@/lib/tokens/standard-schema";
import type { TokenType } from "@/lib/types";

// Which token.type a role's picker should filter to.
const CATEGORY_TO_TYPE: Record<StandardRoleCategory, TokenType> = {
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

/**
 * Typography roles split into sub-shapes because "typography" covers family
 * strings, pixel sizes, unitless line-heights, and numeric weights. A picker
 * for font-size should not surface `Inter, sans-serif`, and vice versa.
 */
function typographySubShape(roleKey: string): "family" | "size" | "weight" | "lineHeight" | null {
  if (roleKey.startsWith("font-size")) return "size";
  if (roleKey.startsWith("font-weight")) return "weight";
  if (roleKey.startsWith("line-height")) return "lineHeight";
  if (roleKey.startsWith("font-sans") || roleKey.startsWith("font-serif") || roleKey.startsWith("font-mono") || roleKey.startsWith("font-family")) return "family";
  return null;
}

function valueMatchesTypographyShape(value: string, shape: ReturnType<typeof typographySubShape>): boolean {
  const v = value.trim();
  if (shape === "family") return /[,"']/.test(v);
  if (shape === "size") return /^-?\d+(?:\.\d+)?\s*(?:px|rem|em)\b/i.test(v);
  if (shape === "weight") return /^\d{3}$/.test(v) || /^(?:normal|bold|bolder|lighter)$/i.test(v);
  if (shape === "lineHeight") return /^-?\d+(?:\.\d+)?$/.test(v) || /%$/.test(v) || /^-?\d+(?:\.\d+)?\s*(?:px|rem|em)\b/i.test(v);
  return true;
}

interface UnassignedItem {
  name: string;
  cssVariable?: string;
  value: string;
  type: string;
  hidden: boolean;
  /** Optional: existing role label this token is already assigned to. */
  assignedToRole?: string;
}

interface AssignTokenPopoverProps {
  role: StandardRole;
  /** All available tokens to pick from, regardless of assignment state. */
  availableTokens: UnassignedItem[];
  onAssign: (token: UnassignedItem) => void;
  children: React.ReactNode;
}

export function AssignTokenPopover({
  role,
  availableTokens,
  onAssign,
  children,
}: AssignTokenPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter to the role's expected token type so a Font/Shadow/Radius picker
  // doesn't surface colour tokens, and vice versa.
  const expectedType = CATEGORY_TO_TYPE[role.category];
  const isColourRole = expectedType === "color";
  const typoShape = role.category === "typography" ? typographySubShape(role.key) : null;

  const INITIAL_LIMIT = 50;
  const [showAll, setShowAll] = useState(false);

  const { filteredTokens, totalCount } = useMemo(() => {
    let tokens = availableTokens.filter((u) => !u.hidden);
    // Filter by the role's expected token type (colour / typography / spacing / radius / effect / motion).
    tokens = tokens.filter((u) => u.type === expectedType);
    // Typography sub-filter: family vs size vs weight vs line-height values.
    if (typoShape) {
      tokens = tokens.filter((u) => valueMatchesTypographyShape(u.value, typoShape));
    }
    if (search) {
      const q = search.toLowerCase();
      tokens = tokens.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.cssVariable ?? "").toLowerCase().includes(q) ||
          u.value.toLowerCase().includes(q)
      );
    }
    // Sort: unassigned first, then already-assigned; resolved colours before var() refs
    if (isColourRole) {
      tokens.sort((a, b) => {
        const aAssigned = !!a.assignedToRole;
        const bAssigned = !!b.assignedToRole;
        if (aAssigned !== bAssigned) return aAssigned ? 1 : -1;
        const aIsRef = a.value.includes("var(");
        const bIsRef = b.value.includes("var(");
        if (aIsRef !== bIsRef) return aIsRef ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
    }
    // Dedupe by value+name to avoid showing the same token twice
    const seen = new Set<string>();
    const deduped = tokens.filter((t) => {
      const key = `${t.cssVariable ?? t.name}::${t.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const total = deduped.length;
    const limited = showAll ? deduped : deduped.slice(0, INITIAL_LIMIT);
    return { filteredTokens: limited, totalCount: total };
  }, [availableTokens, expectedType, isColourRole, typoShape, search, showAll]);

  const handleSelect = (token: UnassignedItem) => {
    onAssign(token);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 border-[var(--studio-border)] bg-[var(--bg-elevated)] p-0"
      >
        <div className="border-b border-[var(--studio-border)] px-3 py-2">
          <p className="text-[10px] font-medium text-[var(--text-secondary)]">
            Assign to: {role.label}
          </p>
          <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{role.description}</p>
        </div>

        {/* Custom colour input */}
        {isColourRole && (
          <div className="flex items-center gap-2 border-b border-[var(--studio-border)] px-3 py-2">
            <input
              type="color"
              value={search.startsWith("#") && /^#[0-9a-f]{6}$/i.test(search) ? search : "#6366f1"}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="h-6 w-6 shrink-0 cursor-pointer rounded border border-[var(--studio-border)] bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or enter #hex..."
              autoFocus
              className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(search)) {
                  handleSelect({
                    name: `custom-${role.suffix}`,
                    value: search,
                    type: "color",
                    hidden: false,
                  });
                }
              }}
            />
            {/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(search) && (
              <button
                onClick={() =>
                  handleSelect({
                    name: `custom-${role.suffix}`,
                    value: search,
                    type: "color",
                    hidden: false,
                  })
                }
                className="shrink-0 rounded bg-[var(--studio-accent)] px-2 py-0.5 text-[9px] font-medium text-[var(--text-on-accent)]"
              >
                Add
              </button>
            )}
          </div>
        )}

        {/* Search (non-colour roles) */}
        {!isColourRole && (
          <div className="border-b border-[var(--studio-border)] px-3 py-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tokens..."
              autoFocus
              className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        )}

        {/* Token list */}
        <div className="max-h-64 overflow-y-auto py-1">
          {filteredTokens.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-[var(--text-muted)]">
              No matching tokens found
            </p>
          ) : (
            <>
              {filteredTokens.map((token, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(token)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[var(--bg-hover)]"
                >
                  {isColourRole && (
                    <div
                      className="h-4 w-4 shrink-0 rounded border border-[var(--studio-border)]"
                      style={{ backgroundColor: token.value }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[10px] text-[var(--text-secondary)]">
                      {token.cssVariable ?? token.name}
                    </p>
                    <p className="truncate font-mono text-[9px] text-[var(--text-muted)]">
                      {token.value}
                    </p>
                  </div>
                  {token.assignedToRole && (
                    <span className="shrink-0 rounded bg-[var(--bg-hover)] px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {token.assignedToRole}
                    </span>
                  )}
                </button>
              ))}
              {!showAll && totalCount > INITIAL_LIMIT && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full px-3 py-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  + {totalCount - INITIAL_LIMIT} more
                </button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
