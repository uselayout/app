"use client";

import type { ExtractedToken } from "@/lib/types";
import { groupTokensByPurpose, type TokenGroup } from "@/lib/tokens/group-tokens";
import { resolveTokenValue } from "@/lib/util/color";
import { ColourSwatchCard } from "./ColourSwatchCard";

interface ColourPaletteProps {
  tokens: ExtractedToken[];
  cssVariables: Record<string, string>;
  onUpdateToken: (name: string, value: string) => void;
  onRemoveToken: (name: string) => void;
  onRenameToken: (oldName: string, newName: string) => void;
}

export function ColourPalette({
  tokens,
  cssVariables,
  onUpdateToken,
  onRemoveToken,
  onRenameToken,
}: ColourPaletteProps) {
  const groups = groupTokensByPurpose(tokens, "colors");

  // If grouping produced no groups (< threshold), show all as one flat group
  const displayGroups: TokenGroup[] = groups.length > 0
    ? groups
    : [{ label: "All Colours", tokens }];

  return (
    <div className="space-y-8">
      {displayGroups.map((group) => (
        <div
          key={group.label}
          className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4"
        >
          <h3 className="mb-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {group.label}
            <span className="ml-2 text-[var(--text-muted)] opacity-60">{group.tokens.length}</span>
          </h3>
          <div className="flex flex-wrap gap-5">
            {group.tokens.map((token) => {
              const resolved = resolveTokenValue(token.value, cssVariables);
              return (
                <ColourSwatchCard
                  key={token.cssVariable ?? token.name}
                  name={token.name}
                  cssVariable={token.cssVariable}
                  value={token.value}
                  resolvedValue={resolved}
                  description={token.description}
                  onUpdate={(newValue) => onUpdateToken(token.name, newValue)}
                  onRemove={() => onRemoveToken(token.name)}
                  onRename={(newName) => onRenameToken(token.name, newName)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
