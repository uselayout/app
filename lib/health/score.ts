import type { HealthScore, HealthIssue } from "@/lib/types";

// Normalise a hex colour to long-form lowercase so `#fff` and `#FFFFFF` compare equal.
// Expands 3-digit to 6-digit and 4-digit (with alpha) to 8-digit.
function normaliseHex(hex: string): string {
  const lower = hex.toLowerCase();
  if (lower.length === 4) {
    return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`;
  }
  if (lower.length === 5) {
    return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}${lower[4]}${lower[4]}`;
  }
  return lower;
}

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
    (layoutMd ?? "").match(/#[0-9a-fA-F]{3,8}\b/gi)?.map(normaliseHex) ?? []
  );

  // Check for hardcoded hex values.
  // Design system has vars → all hardcoded hex is wrong.
  // Design system has no vars → only flag values absent from the spec.
  const hexMatches = output.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  const uniqueHex = [...new Set(hexMatches.map(normaliseHex))];
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
    if (!approvedHex.has(normaliseHex(`#${inlineMatch[1]}`))) {
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

  // Check spacing compliance against design system grid
  if (layoutMd) {
    const spacingTokenValues = new Set<number>();
    for (const m of layoutMd.matchAll(/--(?:space|spacing|gap|padding|margin)[\w-]*:\s*(\d+)px/gi)) {
      spacingTokenValues.add(parseInt(m[1]!, 10));
    }

    if (spacingTokenValues.size > 0) {
      const offGridValues: string[] = [];
      for (const m of output.matchAll(/(?:p|px|py|pl|pr|pt|pb|m|mx|my|ml|mr|mt|mb|gap)-\[(\d+)px\]/g)) {
        const px = parseInt(m[1]!, 10);
        if (!spacingTokenValues.has(px)) {
          offGridValues.push(`${px}px`);
        }
      }

      if (offGridValues.length > 0) {
        const penalty = Math.min(offGridValues.length * 5, 15);
        score -= penalty;
        issues.push({
          severity: "warning",
          rule: "Spacing matches design system grid",
          actual: `Off-grid values: ${[...new Set(offGridValues)].slice(0, 5).join(", ")}`,
          expected: `Design system spacing: ${[...spacingTokenValues].sort((a, b) => a - b).join(", ")}px`,
        });
      }
    }

    // Check border-radius compliance
    const radiusTokenValues = new Set<string>();
    for (const m of layoutMd.matchAll(/--(?:radius|border-radius|rounded)[\w-]*:\s*(\d+px|\d+%)/gi)) {
      radiusTokenValues.add(m[1]!);
    }

    if (radiusTokenValues.size > 0) {
      const offGridRadius: string[] = [];
      for (const m of output.matchAll(/rounded-\[(\d+px)\]/g)) {
        if (!radiusTokenValues.has(m[1]!)) {
          offGridRadius.push(m[1]!);
        }
      }

      if (offGridRadius.length > 0) {
        score -= 5;
        issues.push({
          severity: "warning",
          rule: "Border radius matches design system",
          actual: `Off-scale: ${[...new Set(offGridRadius)].slice(0, 3).join(", ")}`,
          expected: `Design system radius: ${[...radiusTokenValues].join(", ")}`,
        });
      }
    }
  }

  // ── Interactive state coverage ──────────────────────────────────────────────
  const interactiveElementPattern = /\b(?:<button|<a\s|<input|<select|<textarea|Button|Link|Input|Select|Textarea)\b/i;
  if (interactiveElementPattern.test(output)) {
    const stateTypes: { name: string; pattern: RegExp }[] = [
      { name: "hover", pattern: /:hover|onMouseEnter|hover:/i },
      { name: "focus", pattern: /:focus|onFocus|focus:/i },
      { name: "disabled", pattern: /\bdisabled\b|:disabled|disabled:|aria-disabled/i },
      { name: "active", pattern: /:active|active:/i },
    ];
    const foundStates = stateTypes.filter((s) => s.pattern.test(output));
    if (foundStates.length < 2) {
      score -= 10;
      issues.push({
        severity: "warning",
        rule: "Interactive state coverage",
        actual: foundStates.length === 0
          ? "No interactive states found"
          : `Only ${foundStates.map((s) => s.name).join(", ")} found`,
        expected: "At least 2 of: hover, focus, disabled, active states",
      });
    }
  }

  // ── Accessibility basics ──────────────────────────────────────────────────
  const hasImages = /<(?:img|Image)\b/i.test(output);
  if (hasImages) {
    const imgWithoutAlt = /<(?:img|Image)\b(?![^>]*\balt\s*=)[^>]*>/i.test(output);
    if (imgWithoutAlt) {
      score -= 5;
      issues.push({
        severity: "warning",
        rule: "Images must have alt attributes",
        actual: "<img> or <Image> without alt attribute",
        expected: "All images should have descriptive alt text",
      });
    }
  }

  // Icon-only buttons without aria-label
  const iconOnlyButtonPattern = /<button[^>]*>[\s]*(?:<svg|<Icon|<\w+Icon)[^<]*<\/button>/i;
  if (iconOnlyButtonPattern.test(output)) {
    const hasAriaLabel = /<button[^>]*aria-label\s*=/i.test(output);
    if (!hasAriaLabel) {
      issues.push({
        severity: "warning",
        rule: "Icon-only buttons need aria-label",
        actual: "Button with only icon content and no aria-label",
        expected: "aria-label describing the button action",
      });
    }
  }

  // Semantic HTML bonus
  const semanticTags = ["<main", "<nav", "<section", "<article", "<header", "<footer"];
  const usesSemanticHtml = semanticTags.some((tag) => output.toLowerCase().includes(tag));
  if (usesSemanticHtml) {
    score += 5;
  }

  // ── Animation/motion compliance ───────────────────────────────────────────
  if (layoutMd) {
    const hasMotionTokens = /--(?:motion|duration|transition|ease)-[\w-]+/i.test(layoutMd);
    if (hasMotionTokens) {
      const hasTransitions = /\btransition\s*:|animation\s*:/i.test(output);
      if (hasTransitions) {
        const usesMotionVars = /var\(--(?:motion|duration|transition|ease)-/i.test(output);
        if (usesMotionVars) {
          score += 5;
        } else {
          score -= 5;
          issues.push({
            severity: "warning",
            rule: "Use motion tokens for transitions",
            actual: "Hardcoded transition/animation values",
            expected: "var(--duration-*) or var(--ease-*) tokens",
          });
        }
      }
    }
  }

  // ── Typography compliance ─────────────────────────────────────────────────
  if (layoutMd) {
    const fontFamilyMatches = layoutMd.match(/font-family:\s*["']?([^"';,]+)/gi) ?? [];
    const designFonts = fontFamilyMatches
      .map((m) => m.replace(/font-family:\s*["']?/i, "").trim().toLowerCase())
      .filter((f) => f.length > 0);

    if (designFonts.length > 0) {
      const systemFonts = ["arial", "helvetica", "sans-serif", "times new roman", "times", "serif", "verdana", "georgia", "tahoma"];
      const outputLower = output.toLowerCase();
      const usesSystemFont = systemFonts.some((sf) => {
        const pattern = new RegExp(`font-family[^;]*\\b${sf.replace(/\s+/g, "\\s+")}\\b`, "i");
        return pattern.test(output);
      });
      const usesDesignFont = designFonts.some((df) => outputLower.includes(df));

      if (usesSystemFont && !usesDesignFont) {
        score -= 5;
        issues.push({
          severity: "warning",
          rule: "Use design system fonts",
          actual: "System font used instead of design system font",
          expected: `Design system fonts: ${designFonts.join(", ")}`,
        });
      }
    }
  }

  // ── Responsive patterns ───────────────────────────────────────────────────
  const hasResponsive = /\b(?:sm:|md:|lg:|xl:|2xl:)|@media/i.test(output);
  const isComplexLayout = (output.match(/<div/gi) ?? []).length >= 5;
  if (isComplexLayout && !hasResponsive) {
    score -= 5;
    issues.push({
      severity: "warning",
      rule: "Responsive design patterns",
      actual: "No responsive breakpoints in complex layout",
      expected: "Responsive classes (sm:, md:, lg:) or @media queries",
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
