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
}

export function ColourPalette({
  tokens,
  cssVariables,
  onUpdateToken,
  onRemoveToken,
}: ColourPaletteProps) {
  const groups = groupTokensByPurpose(tokens, "colors");

  // If grouping produced no groups (< threshold), show all as one flat group
  const displayGroups: TokenGroup[] = groups.length > 0
    ? groups
    : [{ label: "All Colours", tokens }];

  return (
    <div className="space-y-6">
      {displayGroups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {group.label}
          </h3>
          <div className="flex flex-wrap gap-4">
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
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
