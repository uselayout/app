// ─────────────────────────────────────────────────────────────────────────────
// PORTED FROM THE CLI — DO NOT EDIT INDEPENDENTLY.
//
// Canonical source:
//   layout-context (uselayout/cli) → src/compliance/rules.ts + src/compliance/checker.ts
//
// This is the same rule set the `check-compliance` MCP tool runs, ported so
// Studio can check pasted code and saved components server-side without
// depending on the CLI package. Rule ids, names, severities and message
// templates MUST stay 1:1 with the CLI. rules.test.ts hashes the rule
// inventory so drift fails loudly — if you change a rule here, change it in
// the CLI first, then update both this file and the hash in the test.
// (Same contract pattern as the Live schema: canonical in layout-context,
// vendored here, guarded by a sync test.)
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal kit shape the rules need — mirrors the CLI's Kit fields they read. */
export interface ComplianceKit {
  tokensCss?: string;
  components: { name: string }[];
}

export interface ComplianceIssue {
  ruleId: string;
  ruleName: string;
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
}

export interface ComplianceResult {
  passed: boolean;
  issues: ComplianceIssue[];
  summary: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  severity: "error" | "warning" | "info";
  check(code: string, kit: ComplianceKit): ComplianceIssue[];
}

function getLineNumber(code: string, index: number): number {
  return code.slice(0, index).split("\n").length;
}

/**
 * Detects hardcoded hex colours (#xxx, #xxxxxx, #xxxxxxxx) and rgb/rgba values
 * that should use design tokens instead.
 */
const hardcodedColours: ComplianceRule = {
  id: "hardcoded-colours",
  name: "Hardcoded Colours",
  description:
    "Detects hardcoded hex colours or rgb/rgba values that should use design tokens.",
  severity: "warning",
  check(code: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Match hex colours: #abc, #aabbcc, #aabbccdd
    // Negative lookbehind for word chars to avoid matching e.g. anchors in URLs
    const hexPattern = /(?<!\w)#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
    let match: RegExpExecArray | null;

    while ((match = hexPattern.exec(code)) !== null) {
      issues.push({
        ruleId: this.id,
        ruleName: this.name,
        severity: this.severity,
        message: `Hardcoded colour "${match[0]}" — consider using a design token instead.`,
        line: getLineNumber(code, match.index),
      });
    }

    // Match rgb()/rgba() values
    const rgbPattern = /rgba?\(\s*\d+/g;

    while ((match = rgbPattern.exec(code)) !== null) {
      issues.push({
        ruleId: this.id,
        ruleName: this.name,
        severity: this.severity,
        message: `Hardcoded colour value "${match[0]}..." — consider using a design token instead.`,
        line: getLineNumber(code, match.index),
      });
    }

    return issues;
  },
};

/**
 * Detects hardcoded pixel values for margin/padding that could use spacing tokens.
 */
const hardcodedSpacing: ComplianceRule = {
  id: "hardcoded-spacing",
  name: "Hardcoded Spacing",
  description:
    "Detects hardcoded pixel values for margin/padding that could use spacing tokens.",
  severity: "info",
  check(code: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Match margin/padding with px values in CSS-like contexts
    const spacingPattern =
      /(?:margin|padding)(?:-(?:top|right|bottom|left))?\s*:\s*\d+px/gi;
    let match: RegExpExecArray | null;

    while ((match = spacingPattern.exec(code)) !== null) {
      issues.push({
        ruleId: this.id,
        ruleName: this.name,
        severity: this.severity,
        message: `Hardcoded spacing "${match[0]}" — consider using a spacing token instead.`,
        line: getLineNumber(code, match.index),
      });
    }

    return issues;
  },
};

/**
 * If the kit has tokensCss, extract all --token-name custom properties and warn
 * when the code uses CSS custom properties not present in the kit's token set.
 */
const missingTokenReference: ComplianceRule = {
  id: "missing-token-reference",
  name: "Missing Token Reference",
  description:
    "Warns when code uses CSS custom properties not defined in the kit's tokens.",
  severity: "warning",
  check(code: string, kit: ComplianceKit): ComplianceIssue[] {
    if (!kit.tokensCss) return [];

    const issues: ComplianceIssue[] = [];

    // Extract all custom property names from the kit's tokensCss
    const kitTokens = new Set<string>();
    const tokenDefPattern = /(--[\w-]+)\s*:/g;
    let defMatch: RegExpExecArray | null;

    while ((defMatch = tokenDefPattern.exec(kit.tokensCss)) !== null) {
      if (defMatch[1]) {
        kitTokens.add(defMatch[1]);
      }
    }

    if (kitTokens.size === 0) return [];

    // Find custom property usages in the code via var(--name)
    const varUsagePattern = /var\(\s*(--[\w-]+)/g;
    let usageMatch: RegExpExecArray | null;

    while ((usageMatch = varUsagePattern.exec(code)) !== null) {
      const tokenName = usageMatch[1];
      if (tokenName && !kitTokens.has(tokenName)) {
        issues.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: this.severity,
          message: `Token "${tokenName}" is not defined in the kit's tokens. Check for typos or use a defined token.`,
          line: getLineNumber(code, usageMatch.index),
        });
      }
    }

    return issues;
  },
};

/**
 * If code imports or references component names not in the kit's component list,
 * flag as info.
 */
const unknownComponent: ComplianceRule = {
  id: "unknown-component",
  name: "Unknown Component",
  description:
    "Flags component references not found in the kit's component list.",
  severity: "info",
  check(code: string, kit: ComplianceKit): ComplianceIssue[] {
    if (kit.components.length === 0) return [];

    const issues: ComplianceIssue[] = [];
    const knownNames = new Set(
      kit.components.map((c) => c.name.toLowerCase()),
    );

    // Detect JSX-style component usage: <ComponentName
    const jsxPattern = /<([A-Z][A-Za-z0-9]+)/g;
    let match: RegExpExecArray | null;

    while ((match = jsxPattern.exec(code)) !== null) {
      const componentName = match[1];
      if (componentName && !knownNames.has(componentName.toLowerCase())) {
        issues.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: this.severity,
          message: `Component "<${componentName}>" is not in the kit's component list. It may be missing or misspelled.`,
          line: getLineNumber(code, match.index),
        });
      }
    }

    return issues;
  },
};

export const defaultRules: ComplianceRule[] = [
  hardcodedColours,
  hardcodedSpacing,
  missingTokenReference,
  unknownComponent,
];

/**
 * Runs all compliance rules against the given code snippet and kit,
 * returning a result with collected issues and a pass/fail status.
 *
 * `passed` is true when there are no "error" severity issues.
 * Warnings and info-level issues do not cause failure.
 *
 * (Port of layout-context src/compliance/checker.ts — keep in lockstep.)
 */
export function checkCompliance(
  code: string,
  kit: ComplianceKit,
  rules: ComplianceRule[] = defaultRules,
): ComplianceResult {
  const issues: ComplianceIssue[] = [];

  for (const rule of rules) {
    const ruleIssues = rule.check(code, kit);
    issues.push(...ruleIssues);
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;
  const passed = errorCount === 0;

  const parts: string[] = [];
  if (errorCount > 0) parts.push(`${errorCount} error${errorCount > 1 ? "s" : ""}`);
  if (warningCount > 0) parts.push(`${warningCount} warning${warningCount > 1 ? "s" : ""}`);
  if (infoCount > 0) parts.push(`${infoCount} info`);

  const summary =
    parts.length === 0
      ? "No issues found — code is compliant."
      : `${passed ? "Passed" : "Failed"} with ${parts.join(", ")}.`;

  return { passed, issues, summary };
}

/**
 * Studio-only convenience: fold issues into a 0-100 score for display.
 * Not part of the CLI contract — the MCP tool reports issues, not a score.
 */
export function complianceScore(issues: ComplianceIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "error") score -= 15;
    else if (issue.severity === "warning") score -= 10;
    else score -= 3;
  }
  return Math.max(0, Math.min(100, score));
}
