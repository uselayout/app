import type { HealthScore, HealthIssue } from "@/lib/types";

export function calculateHealthScore(
  output: string,
  extractedFonts: string[] = []
): HealthScore {
  const issues: HealthIssue[] = [];
  let score = 60; // Base score

  // Check for hardcoded hex values
  const hexMatches = output.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  const uniqueHex = [...new Set(hexMatches)];
  if (uniqueHex.length > 0) {
    const penalty = Math.min(uniqueHex.length * 20, 40);
    score -= penalty;
    for (const hex of uniqueHex.slice(0, 3)) {
      issues.push({
        severity: "error",
        rule: "No hardcoded colours",
        actual: hex,
        expected: "var(--color-*)",
      });
    }
  }

  // Check for CSS variable usage
  const usesVars = /var\(--/.test(output);
  if (usesVars) {
    score += 20;
  } else {
    issues.push({
      severity: "warning",
      rule: "Uses CSS variables",
      actual: "No var(--) references found",
      expected: "CSS custom properties from design system",
    });
  }

  // Check for correct font family
  if (extractedFonts.length > 0) {
    const usesFonts = extractedFonts.some((font) =>
      output.toLowerCase().includes(font.toLowerCase())
    );
    if (usesFonts) {
      score += 20;
    } else {
      issues.push({
        severity: "warning",
        rule: "Uses design system font",
        actual: "Font family not found in output",
        expected: extractedFonts.join(", "),
      });
    }
  }

  // Check for inline styles with hardcoded colours
  const inlineColorPattern = /style=\{?\{[^}]*(?:color|background)[^}]*#[0-9a-fA-F]/i;
  if (!inlineColorPattern.test(output)) {
    score += 10;
  } else {
    issues.push({
      severity: "error",
      rule: "No inline hardcoded colours",
      actual: "Inline style with hardcoded colour found",
      expected: "CSS variables or Tailwind classes",
    });
  }

  const total = Math.max(0, Math.min(100, score));

  return {
    total,
    tokenFaithfulness: usesVars ? 80 : 20,
    // componentAccuracy: placeholder until component-level checking is implemented
    componentAccuracy: issues.length === 0 ? 80 : 40,
    antiPatternViolations: uniqueHex.length,
    issues,
  };
}
