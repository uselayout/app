"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import type { StandardRole } from "@/lib/tokens/standard-schema";
import type { ProjectStandardisation } from "@/lib/types";

interface UnassignedItem {
  name: string;
  cssVariable?: string;
  value: string;
  type: string;
  hidden: boolean;
}

interface AssignTokenPopoverProps {
  role: StandardRole;
  unassigned: UnassignedItem[];
  onAssign: (token: UnassignedItem) => void;
  children: React.ReactNode;
}

export function AssignTokenPopover({
  role,
  unassigned,
  onAssign,
  children,
}: AssignTokenPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter to colour tokens for colour roles, or matching type
  const colourCategories = ["backgrounds", "text", "borders", "accent", "status"];
  const isColourRole = colourCategories.includes(role.category);

  const INITIAL_LIMIT = 30;
  const [showAll, setShowAll] = useState(false);

  const { filteredTokens, totalCount } = useMemo(() => {
    let tokens = unassigned.filter((u) => !u.hidden);
    if (isColourRole) {
      tokens = tokens.filter((u) => u.type === "color");
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
    // Sort: resolved hex/named colours first, var() references last
    if (isColourRole) {
      tokens.sort((a, b) => {
        const aIsRef = a.value.includes("var(");
        const bIsRef = b.value.includes("var(");
        if (aIsRef !== bIsRef) return aIsRef ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
    }
    const total = tokens.length;
    const limited = showAll ? tokens : tokens.slice(0, INITIAL_LIMIT);
    return { filteredTokens: limited, totalCount: total };
  }, [unassigned, isColourRole, search, showAll]);

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
