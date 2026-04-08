import type { ExtractedTokens, ExtractedToken } from "@/lib/types";

interface DTCGTokenFlat {
  $type: string;
  $value: string;
  $description?: string;
  $extensions?: { "com.layout.alias"?: string };
}

interface DTCGTokenTypography {
  $type: "typography";
  $value: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: number | string;
    lineHeight?: string;
    letterSpacing?: string;
  };
  $description?: string;
}

type DTCGToken = DTCGTokenFlat | DTCGTokenTypography;

interface DTCGGroup {
  [key: string]: DTCGToken | DTCGGroup;
}

function parseTypographyValue(value: string): {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
} {
  const parts: Record<string, string> = {};
  for (const segment of value.split(";")) {
    const colonIdx = segment.indexOf(":");
    if (colonIdx === -1) continue;
    const key = segment.slice(0, colonIdx).trim();
    const val = segment.slice(colonIdx + 1).trim();
    if (key && val) parts[key] = val;
  }
  return {
    fontFamily: parts["font-family"],
    fontSize: parts["font-size"],
    fontWeight: parts["font-weight"],
    lineHeight: parts["line-height"],
    letterSpacing: parts["letter-spacing"],
  };
}

function tokenToDTCG(token: ExtractedToken): DTCGToken {
  // Typography tokens: parse composite value into structured output
  if (token.type === "typography") {
    const parsed = parseTypographyValue(token.value);
    const weightNum = parsed.fontWeight ? parseInt(parsed.fontWeight, 10) : undefined;
    return {
      $type: "typography",
      $value: {
        ...(parsed.fontFamily ? { fontFamily: parsed.fontFamily } : {}),
        ...(parsed.fontSize ? { fontSize: parsed.fontSize } : {}),
        ...(weightNum && !isNaN(weightNum) ? { fontWeight: weightNum } : parsed.fontWeight ? { fontWeight: parsed.fontWeight } : {}),
        ...(parsed.lineHeight ? { lineHeight: parsed.lineHeight } : {}),
        ...(parsed.letterSpacing ? { letterSpacing: parsed.letterSpacing } : {}),
      },
      ...(token.description ? { $description: token.description } : {}),
    };
  }

  // Motion tokens: determine duration vs cubicBezier
  if (token.type === "motion") {
    const val = token.value.toLowerCase();
    let dtcgType: string;
    if (/cubic-bezier|ease/.test(val)) {
      dtcgType = "cubicBezier";
    } else {
      dtcgType = "duration";
    }
    return {
      $type: dtcgType,
      $value: token.value,
      ...(token.description ? { $description: token.description } : {}),
    };
  }

  const dtcgType =
    token.type === "color"
      ? "color"
      : token.type === "spacing"
        ? "dimension"
        : token.type === "radius"
          ? "dimension"
          : "shadow";

  return {
    $type: dtcgType,
    $value: token.reference || token.value,
    ...(token.description ? { $description: token.description } : {}),
    ...(token.reference ? { $extensions: { "com.layout.alias": token.reference } } : {}),
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
  if ((tokens.motion ?? []).length > 0) {
    output.motion = groupTokens(tokens.motion);
  }

  return JSON.stringify(output, null, 2);
}
