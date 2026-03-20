import type { HealthScore, HealthIssue } from "@/lib/types";

export function calculateHealthScore(
  output: string,
  extractedFonts: string[] = [],
  layoutMd?: string
): HealthScore {
  const issues: HealthIssue[] = [];
  let score = 60; // Base score

  // True only if the design system actually defines CSS vars as CSS declarations (ending with ;)
  // Documentation mentions like "--color: #value" without semicolons don't count
  const hasCssVars = /--[\w-]+:\s*[#\w0-9][^;\n]*;/.test(layoutMd ?? "");
  const approvedHex = new Set(
    (layoutMd ?? "").match(/#[0-9a-fA-F]{3,8}\b/gi)?.map((h) => h.toLowerCase()) ?? []
  );

  // Check for hardcoded hex values.
  // Design system has vars → all hardcoded hex is wrong.
  // Design system has no vars → only flag values absent from the spec.
  const hexMatches = output.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  const uniqueHex = [...new Set(hexMatches.map((h) => h.toLowerCase()))];
  const rogueHex = uniqueHex.filter((h) => !approvedHex.has(h));

  if (rogueHex.length > 0) {
    const penalty = Math.min(rogueHex.length * 20, 40);
    score -= penalty;
    for (const hex of rogueHex.slice(0, 3)) {
      issues.push({
        severity: "error",
        rule: "No hardcoded colours",
        actual: hex,
        expected: hasCssVars ? "var(--color-*)" : "Value not in design system",
      });
    }
  }

  // Check for CSS variable usage — only penalise when the design system defines vars
  const usesVars = /var\(--/.test(output);
  if (hasCssVars) {
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
  } else if (usesVars) {
    score += 10;
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

  // Check for inline styles with colours not from the design system
  const inlineColorPattern = /style=\{?\{[^}]*(?:color|background)[^}]*#([0-9a-fA-F]{3,8})/gi;
  let inlineMatch;
  let hasRogueInlineColor = false;
  while ((inlineMatch = inlineColorPattern.exec(output)) !== null) {
    if (!approvedHex.has(`#${inlineMatch[1].toLowerCase()}`)) {
      hasRogueInlineColor = true;
      break;
    }
  }
  if (!hasRogueInlineColor) {
    score += 10;
  } else {
    issues.push({
      severity: "error",
      rule: "No inline hardcoded colours",
      actual: "Inline style with colour not in design system",
      expected: "CSS variables or Tailwind classes",
    });
  }

  const total = Math.max(0, Math.min(100, score));

  return {
    total,
    tokenFaithfulness: usesVars ? 80 : !hasCssVars ? 80 : 20,
    componentAccuracy: issues.length === 0 ? 80 : 40,
    antiPatternViolations: rogueHex.length,
    issues,
  };
}
