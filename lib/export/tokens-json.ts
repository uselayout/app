import type { ExtractedTokens, ExtractedToken } from "@/lib/types";

interface DTCGToken {
  $type: string;
  $value: string;
  $description?: string;
}

interface DTCGGroup {
  [key: string]: DTCGToken | DTCGGroup;
}

function tokenToDTCG(token: ExtractedToken): DTCGToken {
  const dtcgType =
    token.type === "color"
      ? "color"
      : token.type === "typography"
        ? "fontFamily"
        : token.type === "spacing"
          ? "dimension"
          : token.type === "radius"
            ? "dimension"
            : "shadow";

  return {
    $type: dtcgType,
    $value: token.value,
    ...(token.description ? { $description: token.description } : {}),
  };
}

function groupTokens(tokens: ExtractedToken[]): DTCGGroup {
  const group: DTCGGroup = {};
  for (const token of tokens) {
    const key = token.name
      .toLowerCase()
      .replace(/[/\s]+/g, ".")
      .replace(/[^a-z0-9.]/g, "");
    group[key] = tokenToDTCG(token);
  }
  return group;
}

export function generateTokensJson(tokens: ExtractedTokens): string {
  const output: DTCGGroup = {};

  if (tokens.colors.length > 0) {
    output.color = groupTokens(tokens.colors);
  }
  if (tokens.typography.length > 0) {
    output.typography = groupTokens(tokens.typography);
  }
  if (tokens.spacing.length > 0) {
    output.spacing = groupTokens(tokens.spacing);
  }
  if (tokens.radius.length > 0) {
    output.radius = groupTokens(tokens.radius);
  }
  if (tokens.effects.length > 0) {
    output.effect = groupTokens(tokens.effects);
  }

  return JSON.stringify(output, null, 2);
}
