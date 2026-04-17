import type {
  ExtractedTokens,
  ExtractedToken,
  ProjectStandardisation,
  TokenType,
} from "@/lib/types";
import { getRoleByKey, type StandardRoleCategory } from "./standard-schema";

/**
 * Map a StandardRole category to the ExtractedTokens bucket it belongs in.
 * All colour-like categories collapse to "color"; shadows become "effect".
 */
function categoryToTokenType(cat: StandardRoleCategory): TokenType {
  switch (cat) {
    case "backgrounds":
    case "text":
    case "borders":
    case "accent":
    case "status":
      return "color";
    case "typography":
      return "typography";
    case "spacing":
      return "spacing";
    case "radius":
      return "radius";
    case "shadows":
      return "effect";
    case "motion":
      return "motion";
  }
}

/**
 * Build an ExtractedTokens shape from standardisation assignments so the
 * downstream generators (tokens.css, tokens.json, tailwind.config, MCP
 * get_tokens) can emit the curated ~25–30 roles as the canonical model
 * rather than the raw long-tail extraction. Returns null when there's
 * nothing curated to emit, so callers can fall back to raw.
 */
export function buildCuratedExtractedTokens(
  standardisation: ProjectStandardisation | undefined
): ExtractedTokens | null {
  if (!standardisation) return null;
  const assignments = Object.values(standardisation.assignments ?? {});
  if (assignments.length === 0) return null;

  const buckets: ExtractedTokens = {
    colors: [],
    typography: [],
    spacing: [],
    radius: [],
    effects: [],
    motion: [],
  };

  for (const a of assignments) {
    const role = getRoleByKey(a.roleKey);
    if (!role) continue;

    const type = categoryToTokenType(role.category);
    const token: ExtractedToken = {
      name: a.standardName.replace(/^--/, ""),
      value: a.value,
      type,
      category: "semantic",
      cssVariable: a.standardName,
      description: role.description,
      standardRole: a.roleKey,
      standardName: a.standardName,
      standardConfidence: a.confidence,
    };

    switch (type) {
      case "color":
        buckets.colors.push(token);
        break;
      case "typography":
        buckets.typography.push(token);
        break;
      case "spacing":
        buckets.spacing.push(token);
        break;
      case "radius":
        buckets.radius.push(token);
        break;
      case "effect":
        buckets.effects.push(token);
        break;
      case "motion":
        buckets.motion.push(token);
        break;
    }
  }

  const total =
    buckets.colors.length +
    buckets.typography.length +
    buckets.spacing.length +
    buckets.radius.length +
    buckets.effects.length +
    buckets.motion.length;

  return total > 0 ? buckets : null;
}
