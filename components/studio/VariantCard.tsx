"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, ThumbsUp, ThumbsDown, Copy, RotateCw, Figma, Monitor, BookMarked, ArrowUp, ImagePlus, GitCompareArrows, Trash2, MousePointer2, X, AlertTriangle, Code2 } from "lucide-react";
import { extractComponentName, buildSrcdoc, sanitizeRelativeSrc } from "@/lib/explore/preview-helpers";
import { getInspectorScript } from "@/lib/explore/inspector-script";
import { pushManualEdit, pushAiEdit, pushRollback, undoLastEdit } from "@/lib/explore/edit-history";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ElementInspector } from "@/components/studio/ElementInspector";
import { EditHistoryPanel } from "@/components/studio/EditHistoryPanel";
import { VariantCodeEditor } from "@/components/studio/VariantCodeEditor";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { countPlaceholderImages } from "@/lib/image/placeholder";
import { PaperIcon } from "@/components/studio/PaperPushModal";
import type { BrandingAsset, DesignVariant, StyleEdit, EditEntry, EditHistory, ElementAnnotation, ExtractedToken, FontDeclaration, UploadedFont } from "@/lib/types";


// ---------------------------------------------------------------------------
// Direct style edit — instant, no AI call
// ---------------------------------------------------------------------------

/** CSS property name → Tailwind class mapping */
const CSS_TO_TAILWIND: Record<string, (val: string) => string> = {
  fontWeight: (v) => `font-[${v}]`,
  fontSize: (v) => `text-[${v}]`,
  lineHeight: (v) => `leading-[${v}]`,
  letterSpacing: (v) => `tracking-[${v}]`,
  fontFamily: (v) => `font-[${v.replace(/\s/g, "_").replace(/['"]/g, "")}]`,
  textAlign: (v) => {
    const map: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right", justify: "text-justify" };
    return map[v] ?? `text-[${v}]`;
  },
  display: (v) => {
    const map: Record<string, string> = { block: "block", flex: "flex", grid: "grid", inline: "inline", "inline-flex": "inline-flex", "inline-block": "inline-block", none: "hidden" };
    return map[v] ?? `[display:${v}]`;
  },
  flexDirection: (v) => {
    const map: Record<string, string> = { row: "flex-row", column: "flex-col", "row-reverse": "flex-row-reverse", "column-reverse": "flex-col-reverse" };
    return map[v] ?? `[flex-direction:${v}]`;
  },
  alignItems: (v) => {
    const map: Record<string, string> = { stretch: "items-stretch", "flex-start": "items-start", "flex-end": "items-end", center: "items-center", baseline: "items-baseline" };
    return map[v] ?? `items-[${v}]`;
  },
  justifyContent: (v) => {
    const map: Record<string, string> = { "flex-start": "justify-start", "flex-end": "justify-end", center: "justify-center", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly" };
    return map[v] ?? `justify-[${v}]`;
  },
  color: (v) => `text-[${v.replace(/\s/g, "")}]`,
  backgroundColor: (v) => `bg-[${v.replace(/\s/g, "")}]`,
  borderColor: (v) => `border-[${v.replace(/\s/g, "")}]`,
  borderRadius: (v) => `rounded-[${v}]`,
  borderWidth: (v) => `border-[${v}]`,
  opacity: (v) => `opacity-[${v}]`,
  gap: (v) => `gap-[${v}]`,
  width: (v) => `w-[${v}]`,
  height: (v) => `h-[${v}]`,
  maxWidth: (v) => `max-w-[${v}]`,
  paddingTop: (v) => `pt-[${v}]`,
  paddingRight: (v) => `pr-[${v}]`,
  paddingBottom: (v) => `pb-[${v}]`,
  paddingLeft: (v) => `pl-[${v}]`,
  marginTop: (v) => `mt-[${v}]`,
  marginRight: (v) => `mr-[${v}]`,
  marginBottom: (v) => `mb-[${v}]`,
  marginLeft: (v) => `ml-[${v}]`,
};

/**
 * Tailwind class prefix patterns for each CSS property (for removal).
 * Layout properties (display, flexDirection, alignItems, justifyContent) use
 * negative lookbehind (?<![\w:]) to ONLY match base classes, preserving
 * responsive variants like md:flex-row, lg:items-center, etc.
 */
const TAILWIND_PREFIXES: Record<string, RegExp> = {
  fontWeight: /\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[\d+\])\b/g,
  fontSize: /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[[^\]]+\])\b/g,
  lineHeight: /\bleading-(?:none|tight|snug|normal|relaxed|loose|\[[^\]]+\])\b/g,
  letterSpacing: /\btracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])\b/g,
  fontFamily: /\bfont-(?:sans|serif|mono|\[[^\]]+\])\b/g,
  textAlign: /\btext-(?:left|center|right|justify)\b/g,
  // Layout props: only match BASE class, not responsive variants (sm:flex, md:flex-row, etc.)
  display: /(?<![\w:])(?:block|flex|grid|inline|inline-flex|inline-block|hidden)\b/g,
  flexDirection: /(?<![\w:])flex-(?:row|col|row-reverse|col-reverse)\b/g,
  alignItems: /(?<![\w:])items-(?:start|end|center|baseline|stretch)\b/g,
  justifyContent: /(?<![\w:])justify-(?:start|end|center|between|around|evenly)\b/g,
  color: /\btext-\[(?:rgb|rgba|#)[^\]]*\]\b/g,
  backgroundColor: /\bbg-\[(?:rgb|rgba|#)[^\]]*\]\b/g,
  borderColor: /\bborder-\[(?:rgb|rgba|#)[^\]]*\]\b/g,
  borderRadius: /\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\]))?\b/g,
  borderWidth: /\bborder(?:-(?:[0248]|\[[^\]]+\]))?\b(?!-\[(?:rgb|rgba|#))/g,
  opacity: /\bopacity-(?:\d+|\[[^\]]+\])\b/g,
  gap: /\bgap-(?:\d+|\[[^\]]+\])\b/g,
  width: /\bw-(?:\d+|full|screen|auto|min|max|fit|\[[^\]]+\])\b/g,
  height: /\bh-(?:\d+|full|screen|auto|min|max|fit|\[[^\]]+\])\b/g,
  maxWidth: /\bmax-w-(?:\d+|none|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|min|max|fit|prose|screen-sm|screen-md|screen-lg|screen-xl|screen-2xl|\[[^\]]+\])\b/g,
  paddingTop: /\bpt-(?:\d+|\[[^\]]+\])\b/g,
  paddingRight: /\bpr-(?:\d+|\[[^\]]+\])\b/g,
  paddingBottom: /\bpb-(?:\d+|\[[^\]]+\])\b/g,
  paddingLeft: /\bpl-(?:\d+|\[[^\]]+\])\b/g,
  marginTop: /\bmt-(?:\d+|auto|\[[^\]]+\])\b/g,
  marginRight: /\bmr-(?:\d+|auto|\[[^\]]+\])\b/g,
  marginBottom: /\bmb-(?:\d+|auto|\[[^\]]+\])\b/g,
  marginLeft: /\bml-(?:\d+|auto|\[[^\]]+\])\b/g,
};

/**
 * Find the opening tag region in source code for a specific element identified
 * by its tag name and CSS classes. Scores candidates by class overlap and
 * returns null if the match is ambiguous (tied scores) or below threshold.
 */
/**
 * Find the opening tag region for an element by tag name + class matching.
 * Uses a bracket-counting parser to handle arbitrarily nested JSX expressions
 * that regex alone cannot parse reliably.
 */
function findElementRegion(
  code: string,
  elementTag: string,
  elementClasses: string,
): { tagStart: number; tagEnd: number; tagContent: string } | null {
  if (!elementTag) return null;
  const classWords = elementClasses.split(/\s+/).filter(Boolean);

  // Find all positions where this tag opens
  const tagOpen = new RegExp(`<${elementTag}\\b`, "g");
  const candidates: { tagStart: number; tagEnd: number; tagContent: string; score: number }[] = [];

  let openMatch: RegExpExecArray | null;
  while ((openMatch = tagOpen.exec(code)) !== null) {
    const tagStart = openMatch.index;
    // Walk forward, counting braces and handling strings, to find > or />
    let i = tagStart + openMatch[0].length;
    let braceDepth = 0;
    let inString: string | false = false;
    let tagEnd = -1;

    while (i < code.length) {
      const ch = code[i];
      if (inString) {
        if (ch === inString && code[i - 1] !== "\\") inString = false;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") { inString = ch; i++; continue; }
      if (ch === "{") { braceDepth++; i++; continue; }
      if (ch === "}") { braceDepth--; i++; continue; }
      if (braceDepth === 0) {
        if (ch === "/" && code[i + 1] === ">") { tagEnd = i + 2; break; }
        if (ch === ">") { tagEnd = i + 1; break; }
      }
      i++;
    }
    if (tagEnd === -1) continue;

    const tagContent = code.slice(tagStart, tagEnd);

    // Score by class overlap
    let score = 0;
    const classAttr = /(?:className|class)=(?:["']|\{["'])([^"']*?)(?:["']|["']\})/.exec(tagContent);
    if (classAttr) {
      const capturedWords = classAttr[1].split(/\s+/).filter(Boolean);
      for (const w of classWords) {
        if (capturedWords.includes(w)) score++;
      }
    }
    candidates.push({ tagStart, tagEnd, tagContent, score });
  }

  if (candidates.length === 0) return null;
  // If no classes to match, and only one element of this tag exists, use it
  if (classWords.length === 0) {
    if (candidates.length === 1) return candidates[0];
    return null; // ambiguous
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  const minRequired = Math.min(classWords.length, 2);
  if (candidates[0].score < minRequired) return null;
  // Reject if tied with second-best (ambiguous)
  if (candidates.length > 1 && candidates[0].score === candidates[1].score) return null;

  return candidates[0];
}

/**
 * Find all className attributes in source code and return the best match for
 * the given DOM classes. Uses a scoring approach: a className attribute that
 * contains more of the DOM classes ranks higher, and we require at least 2
 * matching words (or 1 if the element only has 1 class).
 * When elementTag is provided, only considers className attributes within
 * opening tags of that element type.
 */
function findBestClassNameMatch(code: string, elementClasses: string, elementTag?: string): { full: string; captured: string; index: number; attrName: "className" | "class" } | null {
  const classWords = elementClasses.split(/\s+/).filter(Boolean);
  if (classWords.length === 0) return null;
  const minRequired = Math.min(classWords.length, 2);

  // If we have an element tag, scope the search to opening tags of that type
  const searchRegions: { text: string; offset: number }[] = [];
  if (elementTag) {
    const tagRegex = new RegExp(`<${elementTag}\\b(?:[^>"'{}]|"[^"]*"|'[^']*'|\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\})*(?:/>|>)`, "g");
    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(code)) !== null) {
      searchRegions.push({ text: m[0], offset: m.index });
    }
  } else {
    searchRegions.push({ text: code, offset: 0 });
  }

  // Find both className="..." (JSX) and class="..." (plain HTML) attributes
  const classAttrRegex = /(?:className|class)=(?:["']|\{["'])([^"']*?)(?:["']|["']\})/g;
  let best: { full: string; captured: string; index: number; score: number; attrName: "className" | "class" } | null = null;

  for (const region of searchRegions) {
    classAttrRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = classAttrRegex.exec(region.text)) !== null) {
      const captured = match[1];
      const capturedWords = captured.split(/\s+/).filter(Boolean);
      let score = 0;
      for (const w of classWords) {
        if (capturedWords.includes(w)) score++;
      }
      if (score >= minRequired && (!best || score > best.score)) {
        const attrName = match[0].startsWith("className") ? "className" as const : "class" as const;
        best = { full: match[0], captured, index: region.offset + match.index, score, attrName };
      }
    }
  }

  return best;
}

/** Map CSS camelCase property to its JSX style object key (same in most cases) */
const CSS_TO_STYLE_KEY: Record<string, string> = {
  fontWeight: "fontWeight", fontSize: "fontSize", lineHeight: "lineHeight",
  letterSpacing: "letterSpacing", fontFamily: "fontFamily", textAlign: "textAlign",
  display: "display", flexDirection: "flexDirection", alignItems: "alignItems",
  justifyContent: "justifyContent", color: "color", backgroundColor: "backgroundColor",
  borderColor: "borderColor", borderRadius: "borderRadius", borderWidth: "borderWidth",
  opacity: "opacity", gap: "gap", width: "width", height: "height", maxWidth: "maxWidth",
  paddingTop: "paddingTop", paddingRight: "paddingRight", paddingBottom: "paddingBottom",
  paddingLeft: "paddingLeft", marginTop: "marginTop", marginRight: "marginRight",
  marginBottom: "marginBottom", marginLeft: "marginLeft",
};

/**
 * Try to apply a style edit by modifying an inline style={{ ... }} in the source code.
 * Scopes the search to the specific element identified by elementTag + elementClasses
 * to avoid accidentally editing a different element's styles.
 */
function tryDirectInlineStyleEdit(code: string, edit: StyleEdit): string | null {
  const { property, after, elementTag, elementClasses } = edit;
  const styleKey = CSS_TO_STYLE_KEY[property];
  if (!styleKey) return null;

  // Quote the new value appropriately
  const isNumeric = /^\d+(\.\d+)?$/.test(after);
  const quotedValue = isNumeric ? after : `"${after}"`;

  // Try to scope to the correct element using tag + classes
  const region = findElementRegion(code, elementTag, elementClasses);
  if (region) {
    // Search only within the matched element's opening tag for the style property
    const propRegex = new RegExp(
      `(${styleKey}\\s*:\\s*)(?:"[^"]*"|'[^']*'|[^,}\\s]+)`,
      "g",
    );
    let found = false;
    const updatedTag = region.tagContent.replace(propRegex, (match, prefix) => {
      if (found) return match;
      found = true;
      return `${prefix}${quotedValue}`;
    });
    if (found && updatedTag !== region.tagContent) {
      return code.slice(0, region.tagStart) + updatedTag + code.slice(region.tagEnd);
    }
    // Element found but no inline style for this property — return null (try Tailwind next)
    return null;
  }

  // Fallback: no element region found — search globally (single-element variants)
  const propRegex = new RegExp(
    `(${styleKey}\\s*:\\s*)(?:"[^"]*"|'[^']*'|[^,}\\s]+)`,
    "g",
  );
  let found = false;
  const result = code.replace(propRegex, (match, prefix) => {
    if (found) return match;
    found = true;
    return `${prefix}${quotedValue}`;
  });

  return found && result !== code ? result : null;
}

/**
 * Try to apply a textContent edit by finding and replacing the text in the source code.
 */
function tryDirectTextEdit(code: string, edit: StyleEdit): string | null {
  if (edit.property !== "textContent" || !edit.before || !edit.after) return null;

  const escapedBefore = edit.before.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Find the literal text in JSX (between > and <)
  const textInJsx = new RegExp(`(>\\s*)${escapedBefore}(\\s*<)`, "g");
  let found = false;
  const result = code.replace(textInJsx, (match, prefix, suffix) => {
    if (found) return match;
    found = true;
    return `${prefix}${edit.after}${suffix}`;
  });
  if (found) return result;

  // Also try as a string literal (e.g. inside a variable or prop)
  const asString = new RegExp(`(["'])${escapedBefore}\\1`);
  const stringMatch = code.match(asString);
  if (stringMatch) {
    const quote = stringMatch[1];
    return code.replace(stringMatch[0], `${quote}${edit.after}${quote}`);
  }

  return null;
}

/**
 * Add an inline style property to an element that doesn't already have one.
 * This is used as a fallback when the element's style is defined in a <style>
 * block — inline styles override all CSS classes regardless of specificity.
 */
function tryAddInlineStyle(code: string, edit: StyleEdit): string | null {
  const { property, after, elementTag, elementClasses } = edit;
  const styleKey = CSS_TO_STYLE_KEY[property];
  if (!styleKey) return null;

  const region = findElementRegion(code, elementTag, elementClasses);
  if (!region) return null;

  const isNumeric = /^\d+(\.\d+)?$/.test(after);
  const quotedValue = isNumeric ? after : `"${after}"`;

  // Check if element already has a style={{ }} block — append to it
  const styleBlockMatch = /style=\{\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\}/.exec(region.tagContent);
  if (styleBlockMatch) {
    const existing = styleBlockMatch[1].trim();
    const separator = existing.endsWith(",") ? " " : ", ";
    const newBlock = `style={{ ${existing}${separator}${styleKey}: ${quotedValue} }}`;
    const updatedTag = region.tagContent.replace(styleBlockMatch[0], newBlock);
    return code.slice(0, region.tagStart) + updatedTag + code.slice(region.tagEnd);
  }

  // Check for HTML-style style="..." attribute — append to it
  const htmlStyleMatch = /style="([^"]*)"/.exec(region.tagContent);
  if (htmlStyleMatch) {
    const existing = htmlStyleMatch[1].trim();
    const kebabProp = styleKey.replace(/([A-Z])/g, "-$1").toLowerCase();
    const separator = existing.endsWith(";") ? " " : "; ";
    const newStyle = `style="${existing}${separator}${kebabProp}: ${after}"`;
    const updatedTag = region.tagContent.replace(htmlStyleMatch[0], newStyle);
    return code.slice(0, region.tagStart) + updatedTag + code.slice(region.tagEnd);
  }

  // No style attribute at all — add one before the closing > or />
  const closingMatch = region.tagContent.match(/(\/?>)\s*$/);
  if (closingMatch) {
    const insertPos = region.tagContent.lastIndexOf(closingMatch[1]);
    const styleAttr = ` style={{ ${styleKey}: ${quotedValue} }}`;
    const updatedTag = region.tagContent.slice(0, insertPos) + styleAttr + region.tagContent.slice(insertPos);
    return code.slice(0, region.tagStart) + updatedTag + code.slice(region.tagEnd);
  }

  return null;
}

/**
 * Convert a camelCase JS style property to kebab-case CSS property.
 * e.g. paddingTop → padding-top, backgroundColor → background-color
 */
function toKebabCase(prop: string): string {
  return prop.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/**
 * Try to edit a CSS property value directly inside a <style> block.
 * Matches CSS rules by the element's class names and replaces the property value.
 * This is critical for AI-generated components that use <style> blocks instead of
 * inline styles or Tailwind classes.
 */
function tryDirectStyleBlockEdit(code: string, edit: StyleEdit): string | null {
  const { property, after, elementClasses } = edit;
  const kebabProp = toKebabCase(property);
  if (!kebabProp) return null;

  // Find <style> or <style jsx> blocks in the code
  const styleBlockRegex = /<style(?:\s[^>]*)?>([^]*?)<\/style>/gi;
  let styleMatch: RegExpExecArray | null;
  const classWords = elementClasses.split(/\s+/).filter(Boolean);
  if (classWords.length === 0) return null;

  while ((styleMatch = styleBlockRegex.exec(code)) !== null) {
    const styleContent = styleMatch[1];
    const styleStart = styleMatch.index + styleMatch[0].indexOf(styleContent);

    // Try each class to find a matching CSS rule
    for (const cls of classWords) {
      // Match rules like .className { ... } - handle both exact and compound selectors
      const escapedCls = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const ruleRegex = new RegExp(
        `(\\.${escapedCls}\\b[^{]*\\{)([^}]*)\\}`,
        "g",
      );
      let ruleMatch: RegExpExecArray | null;
      while ((ruleMatch = ruleRegex.exec(styleContent)) !== null) {
        const ruleBody = ruleMatch[2];
        // Find the property in this rule
        const propRegex = new RegExp(
          `(${kebabProp}\\s*:\\s*)([^;!}]+)(\\s*(?:!important)?\\s*[;}])`,
        );
        const propMatch = propRegex.exec(ruleBody);
        if (propMatch) {
          const newRuleBody = ruleBody.slice(0, propMatch.index) +
            propMatch[1] + after + propMatch[3] +
            ruleBody.slice(propMatch.index + propMatch[0].length);
          const newStyleContent = styleContent.slice(0, ruleMatch.index + ruleMatch[1].length) +
            newRuleBody + "}" +
            styleContent.slice(ruleMatch.index + ruleMatch[0].length);
          return code.slice(0, styleStart) + newStyleContent + code.slice(styleStart + styleContent.length);
        }
      }
    }
  }

  return null;
}

/**
 * Rewrite a brand-logo `<img>` tag in the source: swap its `src` or
 * `data-brand-variant` attribute. Matches the `<img>` by its
 * `data-brand-logo="{slot}"` attribute so it still works when the tag has
 * no className. Mirrors the strip-src pattern in
 * lib/branding/post-process.ts so JSX "last-src-wins" can't leave a stale
 * value behind.
 */
function tryDirectBrandLogoEdit(code: string, edit: StyleEdit): string | null {
  const slot = edit.brandLogoSlot;
  if (!slot) return null;

  const slotEscaped = slot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const imgRe = new RegExp(
    `<img\\s[^>]*data-brand-logo=["']${slotEscaped}["'][^>]*\\/?>`,
    "i",
  );
  const match = imgRe.exec(code);
  if (!match) return null;

  const tag = match[0];
  let updated = tag;

  if (edit.property === "src") {
    updated = updated
      .replace(/\ssrc\s*=\s*"[^"]*"/gi, "")
      .replace(/\ssrc\s*=\s*'[^']*'/gi, "")
      .replace(/\ssrc\s*=\s*\{[^}]*\}/gi, "")
      .replace(/\/?\s*>$/, ` src="${edit.after}" />`);
  } else if (edit.property === "data-brand-variant") {
    if (/data-brand-variant=/.test(updated)) {
      updated = updated.replace(
        /data-brand-variant=(?:"[^"]*"|'[^']*'|\{[^}]*\})/i,
        `data-brand-variant="${edit.after}"`,
      );
    } else {
      updated = updated.replace(
        new RegExp(`(data-brand-logo=["']${slotEscaped}["'])`, "i"),
        `$1 data-brand-variant="${edit.after}"`,
      );
    }
  } else {
    return null;
  }

  if (updated === tag) return null;
  return code.slice(0, match.index) + updated + code.slice(match.index + tag.length);
}

/**
 * Try to apply a single style edit directly in the source code.
 * Attempts in order:
 *  1. Text content replacement
 *  2. Brand-logo attribute swap (src / data-brand-variant)
 *  3. Modify existing inline style
 *  4. Replace existing Tailwind class (not add new ones)
 *  5. Add new inline style (overrides <style> blocks via specificity)
 *  6. Edit CSS property in <style> block
 * Returns the updated code, or null if all direct paths fail.
 */
function tryDirectStyleEditSingle(code: string, edit: StyleEdit): string | null {
  const { elementClasses, property, after } = edit;

  // Handle text content edits separately
  if (property === "textContent") {
    const textResult = tryDirectTextEdit(code, edit);
    if (textResult) {
      console.debug("[direct-edit] textContent: replaced via direct text match");
      return textResult;
    }
    console.debug("[direct-edit] textContent: no direct match found for:", edit.before?.substring(0, 50));
    return null;
  }

  // Handle brand-logo attribute edits — find the `<img data-brand-logo="{slot}">`
  // and rewrite src or data-brand-variant. Matches by slot instead of classes
  // because brand-logo imgs often have no class at all.
  if (edit.brandLogoSlot && (property === "src" || property === "data-brand-variant")) {
    const brandResult = tryDirectBrandLogoEdit(code, edit);
    if (brandResult) {
      console.debug(`[direct-edit] ${property}: brand-logo edit succeeded (slot=${edit.brandLogoSlot})`);
      return brandResult;
    }
    console.debug(`[direct-edit] ${property}: brand-logo edit failed to find matching <img> (slot=${edit.brandLogoSlot})`);
    return null;
  }

  // Try inline style edit FIRST — inline styles override Tailwind classes in
  // specificity, so if both exist we must edit the inline style for the change
  // to actually take effect in the rendered output.
  const inlineResult = tryDirectInlineStyleEdit(code, edit);
  if (inlineResult) {
    console.debug(`[direct-edit] ${property}: inline style edit succeeded`);
    return inlineResult;
  }

  // Try Tailwind class REPLACEMENT (only if an existing class for this property exists)
  if (elementClasses && CSS_TO_TAILWIND[property]) {
    const classMatch = findBestClassNameMatch(code, elementClasses, edit.elementTag);
    if (classMatch) {
      const prefix = TAILWIND_PREFIXES[property];
      // Only replace if an existing Tailwind class for this property is found.
      // Adding a new Tailwind class doesn't work when a <style> block overrides it.
      if (prefix && prefix.test(classMatch.captured)) {
        prefix.lastIndex = 0; // Reset regex state after .test()
        const newClass = CSS_TO_TAILWIND[property](after);
        let updatedClassName = classMatch.captured.replace(prefix, "").replace(/\s{2,}/g, " ").trim();
        updatedClassName = `${updatedClassName} ${newClass}`;
        const result = code.replace(classMatch.full, `${classMatch.attrName}="${updatedClassName}"`);
        if (result !== code) {
          console.debug(`[direct-edit] ${property}: Tailwind class swap succeeded (${classMatch.attrName})`);
          return result;
        }
      }
    }
  }

  // Try adding a Tailwind class (when element uses Tailwind but lacks a class for this property).
  // Preferred over inline style because it preserves responsive behaviour.
  if (elementClasses && CSS_TO_TAILWIND[property]) {
    const classMatch = findBestClassNameMatch(code, elementClasses, edit.elementTag);
    if (classMatch) {
      const newClass = CSS_TO_TAILWIND[property](after);
      const updatedClassName = `${classMatch.captured} ${newClass}`;
      const result = code.replace(classMatch.full, `${classMatch.attrName}="${updatedClassName}"`);
      if (result !== code) {
        console.debug(`[direct-edit] ${property}: added Tailwind class (preserves responsive)`);
        return result;
      }
    }
  }

  // Fall back to adding an inline style — overrides <style> blocks via CSS specificity
  const addResult = tryAddInlineStyle(code, edit);
  if (addResult) {
    console.debug(`[direct-edit] ${property}: added inline style (overrides <style> block)`);
    return addResult;
  }

  // Try editing CSS property directly in a <style> block
  const styleBlockResult = tryDirectStyleBlockEdit(code, edit);
  if (styleBlockResult) {
    console.debug(`[direct-edit] ${property}: edited <style> block CSS rule`);
    return styleBlockResult;
  }

  console.debug(`[direct-edit] ${property}: all direct edit paths failed, will use AI fallback`);
  return null;
}

/**
 * Try to apply style edits directly in the source code by swapping Tailwind classes
 * or editing inline styles. Returns { code, remaining } where remaining are edits
 * that couldn't be applied directly and need AI assistance.
 */
function tryDirectStyleEdits(code: string, edits: StyleEdit[]): { code: string; remaining: StyleEdit[] } {
  let result = code;
  const remaining: StyleEdit[] = [];

  for (const edit of edits) {
    const edited = tryDirectStyleEditSingle(result, edit);
    if (edited) {
      result = edited;
    } else {
      remaining.push(edit);
    }
  }

  return { code: result, remaining };
}

// Errors from the preview iframe split into two camps:
//   1. Transient — transpile HTTP failures, rate limits, fetch aborts. A retry
//      can resolve these, so we show "Retry render".
//   2. Deterministic — JS parse / runtime errors (SyntaxError, ReferenceError,
//      TypeError) emitted by the iframe's window.onerror. The transpile output
//      is pure for a given input, so retrying produces the same failure. For
//      these we offer "View code" instead, so the user has a path forward.
function isTransientPreviewError(error: string): boolean {
  return /^(Transpilation failed|Too many requests|Preview failed|Network|Failed to fetch)/i.test(error);
}

function Tip({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <TooltipPrimitive.Root delayDuration={wide ? 300 : undefined}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          sideOffset={6}
          className={`z-50 rounded-md bg-[var(--bg-elevated)] border border-[var(--studio-border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] animate-in fade-in-0 zoom-in-95 ${wide ? "max-w-xs whitespace-pre-line leading-relaxed" : ""}`}
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

interface VariantCardProps {
  variant: DesignVariant;
  isSelected: boolean;
  onSelect: () => void;
  onRate: (rating: "up" | "down") => void;
  onCopyCode: () => void;
  onPushToFigma: () => void;
  onPushToPaper: () => void;
  onRegenerate: (feedback?: string) => void;
  onResponsive?: () => void;
  onPromoteToLibrary?: () => void;
  onRegenerateImages?: (forceAll?: boolean) => void;
  isProcessingImages?: boolean;
  onViewComparison?: () => void;
  comparisonCount?: number;
  onDelete?: () => void;
  onCodeUpdate?: (code: string, editHistory: EditHistory) => void;
  layoutMd?: string;
  designTokens?: ExtractedToken[];
  cssTokenBlock?: string;
  iconPacks?: string[];
  fonts?: FontDeclaration[];
  uploadedFonts?: UploadedFont[];
  brandingAssets?: BrandingAsset[];
  /** When true, card animates in with a scale-up + fade-in entrance */
  isNewlyGenerated?: boolean;
}

export function VariantCard({
  variant,
  isSelected,
  onSelect,
  onRate,
  onCopyCode,
  onPushToFigma,
  onPushToPaper,
  onRegenerate,
  onResponsive,
  onPromoteToLibrary,
  onRegenerateImages,
  isProcessingImages,
  onViewComparison,
  comparisonCount = 0,
  onDelete,
  onCodeUpdate,
  layoutMd,
  designTokens,
  cssTokenBlock,
  iconPacks,
  fonts,
  uploadedFonts,
  brandingAssets,
  isNewlyGenerated = false,
}: VariantCardProps) {
  // Top-down clip-path reveal for newly generated variants.
  // Starts fully clipped, reveals when preview iframe loads.
  const [revealed, setRevealed] = useState(!isNewlyGenerated);
  const revealedRef = useRef(!isNewlyGenerated);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const transpiledJsRef = useRef<string | null>(null);
  const componentNameRef = useRef<string>("");
  const refineInputRef = useRef<HTMLInputElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [inspectMode, setInspectMode] = useState(false);
  const [codePaneOpen, setCodePaneOpen] = useState(false);
  const [codePaneWidth, setCodePaneWidth] = useState(480);
  const [transpileErrorPos, setTranspileErrorPos] = useState<{ line: number; column: number; message: string } | null>(null);
  const editHistoryRef = useRef<EditHistory>([]);
  const placeholderImageCount = useMemo(() => countPlaceholderImages(variant.code), [variant.code]);
  const [isApplying, setIsApplying] = useState(false);
  const [applyElapsed, setApplyElapsed] = useState(0);
  const [applyError, setApplyError] = useState<string | null>(null);
  const applyAbortRef = useRef<AbortController | null>(null);
  const applyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [previewEntryId, setPreviewEntryId] = useState<string | undefined>();
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const editHistory = variant.editHistory ?? [];
  editHistoryRef.current = editHistory;

  // Restore the user's preferred code-pane width from localStorage. Stored
  // separately from the open/closed state so the pane stays at their
  // preferred size when they reopen it later.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("layout.variantCodePaneWidth");
    if (!stored) return;
    const parsed = Number(stored);
    if (Number.isFinite(parsed) && parsed >= 320 && parsed <= 1200) {
      setCodePaneWidth(parsed);
    }
  }, []);

  // Transpile when code changes (not on inspectMode toggle)
  useEffect(() => {
    if (!variant.code) return;
    setPreviewReady(false);
    setPreviewError(null);
    setContentHeight(null);

    let cancelled = false;

    async function transpileAndRender() {
      try {
        const res = await fetch("/api/transpile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: sanitizeRelativeSrc(variant.code) }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMsg: string = errData?.error || "Transpilation failed";
          setPreviewError(errMsg);
          if (typeof errData?.line === "number" && typeof errData?.column === "number") {
            setTranspileErrorPos({ line: errData.line, column: errData.column, message: errMsg });
          } else {
            setTranspileErrorPos(null);
          }
          return;
        }

        setTranspileErrorPos(null);
        const { js } = await res.json();
        if (cancelled) return;

        const name = extractComponentName(variant.code);
        transpiledJsRef.current = js;
        componentNameRef.current = name;

        // Update the scaled card preview
        const srcdoc = buildSrcdoc(js, name, { variantId: variant.id, iconPacks, fonts, uploadedFonts, cssTokenBlock });
        if (iframeRef.current) {
          iframeRef.current.srcdoc = srcdoc;
          setPreviewReady(true);
          // Trigger top-down reveal after a frame to let the iframe start rendering
          if (!revealedRef.current) {
            revealedRef.current = true;
            requestAnimationFrame(() => setRevealed(true));
          }
        }

        // Also update the fullscreen Inspector iframe if it's open
        if (inspectMode && fullscreenIframeRef.current) {
          const inspectorSrcdoc = buildSrcdoc(js, name, { inspectorScript: getInspectorScript(), iconPacks, fonts, uploadedFonts, cssTokenBlock });
          fullscreenIframeRef.current.srcdoc = inspectorSrcdoc;
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewError(err instanceof Error ? err.message : "Preview failed");
        }
      }
    }

    transpileAndRender();
    return () => { cancelled = true; };
  }, [variant.code, inspectMode, retryKey]);

  // Listen for runtime errors from the preview iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== "layout-preview-error") return;
      // Only handle errors from our own iframe
      if (e.source !== iframeRef.current?.contentWindow) return;
      const fullError = String(e.data.error);
      setPreviewError(fullError);
      setPreviewReady(false);
      // Diagnostic: surface the offending code so users (and we) can locate
      // the bad fragment when a deterministic SyntaxError comes from
      // about:srcdoc. Truncated to keep the console readable.
      console.warn("[variant-render-error]", {
        variantId: variant.id,
        error: fullError,
        code: variant.code.slice(0, 4000),
      });
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [variant.id, variant.code]);

  // Rebuild srcdoc when inspectMode toggles (no re-transpile, instant)
  useEffect(() => {
    const js = transpiledJsRef.current;
    if (!js) return;
    if (inspectMode) {
      // Fullscreen iframe gets the inspector script
      const srcdoc = buildSrcdoc(js, componentNameRef.current, { inspectorScript: getInspectorScript(), iconPacks, fonts, uploadedFonts, cssTokenBlock });
      if (fullscreenIframeRef.current) {
        fullscreenIframeRef.current.srcdoc = srcdoc;
      }
    } else {
      // Exiting inspect mode — React mounts a fresh scaled iframe, restore its srcdoc
      const srcdoc = buildSrcdoc(js, componentNameRef.current, { variantId: variant.id, iconPacks, fonts, uploadedFonts, cssTokenBlock });
      if (iframeRef.current) {
        iframeRef.current.srcdoc = srcdoc;
        setPreviewReady(true);
      }
    }
  }, [inspectMode, variant.id]);

  // Measure iframe content height directly after load (allow-same-origin enables this).
  // Shrinks iframe to 1px first so scrollHeight reflects content, not viewport.
  // Only constrains height when scaled content exceeds the container — short content
  // keeps the default 200% iframe height so component-internal centering still works.
  const measureContentHeight = useCallback(() => {
    setTimeout(() => {
      try {
        const iframe = iframeRef.current;
        const container = previewContainerRef.current;
        const doc = iframe?.contentDocument;
        if (!iframe || !doc || !container) return;
        const prev = iframe.style.height;
        iframe.style.height = "1px";
        const h = doc.documentElement.scrollHeight;
        iframe.style.height = prev;
        const containerHeight = container.clientHeight;
        if (h > 0 && h * 0.5 > containerHeight) {
          setContentHeight(h);
        }
      } catch { /* ignore */ }
    }, 300);
  }, []);

  // Keyboard shortcut: Cmd+Z for undo
  useEffect(() => {
    if (!inspectMode || !onCodeUpdate) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const { history: newHistory, restoredCode } = undoLastEdit(editHistory);
        if (restoredCode !== null) {
          onCodeUpdate!(restoredCode, newHistory);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectMode, editHistory, onCodeUpdate]);

  // Code-pane edit. Mirrors handleStyleEdits' commit pattern (push a manual
  // edit, propagate up via onCodeUpdate). VariantCodeEditor already debounces
  // its onChange, so this fires at most once per ~800ms while typing.
  const handleCodeEdit = useCallback((nextCode: string) => {
    if (!onCodeUpdate) return;
    if (nextCode === variant.code) return;
    const newHistory = pushManualEdit(editHistoryRef.current, variant.code, nextCode, [], "Code edit");
    onCodeUpdate(nextCode, newHistory);
  }, [variant.code, onCodeUpdate]);

  // Drag-to-resize the code pane. Manual handler instead of pulling in a
  // resizable-panels lib for one drag affordance.
  const handleResizePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = codePaneWidth;
    const max = Math.min(1200, window.innerWidth - 320);

    function onMove(ev: PointerEvent) {
      const delta = startX - ev.clientX; // dragging left = wider
      const next = Math.max(320, Math.min(max, startWidth + delta));
      setCodePaneWidth(next);
    }
    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      // Persist after release so we don't thrash localStorage during the drag.
      // setCodePaneWidth has already run; this functional update reads the
      // committed value, writes it, and returns it unchanged.
      setCodePaneWidth((current) => {
        try {
          window.localStorage.setItem("layout.variantCodePaneWidth", String(current));
        } catch {
          // localStorage may be unavailable (privacy mode); ignore.
        }
        return current;
      });
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [codePaneWidth]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(variant.code);
    onCopyCode();
  }, [variant.code, onCopyCode]);

  const handleStyleEdits = useCallback(async (edits: StyleEdit[]) => {
    if (!onCodeUpdate || edits.length === 0) return;

    // Apply as many edits as possible directly (instant Tailwind class swap)
    const { code: directCode, remaining } = tryDirectStyleEdits(variant.code, edits);

    // If we applied some edits directly, commit them immediately
    if (directCode !== variant.code) {
      const directEdits = edits.filter((e) => !remaining.includes(e));
      const description = directEdits
        .map((e) => `${e.property}: ${e.before} → ${e.after}`)
        .join(", ");
      const newHistory = pushManualEdit(editHistory, variant.code, directCode, directEdits, description);
      onCodeUpdate(directCode, newHistory);
    }

    // If all edits were handled directly, we're done — no AI call needed
    if (remaining.length === 0) return;

    // Fall back to AI only for edits that couldn't be applied directly
    const codeForAi = directCode !== variant.code ? directCode : variant.code;
    applyAbortRef.current?.abort();
    const abort = new AbortController();
    applyAbortRef.current = abort;
    const timeout = setTimeout(() => abort.abort(), 120_000);
    setIsApplying(true);
    setApplyError(null);
    setApplyElapsed(0);
    applyTimerRef.current = setInterval(() => setApplyElapsed((t) => t + 1), 1000);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const storedKey = getStoredApiKey();
      if (storedKey) headers["X-Api-Key"] = storedKey;

      const res = await fetch("/api/generate/apply-edits", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: codeForAi,
          styleEdits: remaining,
          layoutMd,
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Request failed" }));
        const msg = errData.error || `Failed (${res.status})`;
        console.error("Style edit failed:", msg);
        setApplyError(msg);
        setTimeout(() => setApplyError(null), 6000);
        return;
      }

      const { code: updatedCode } = await res.json();
      const description = remaining
        .map((e) => `${e.property}: ${e.before} → ${e.after}`)
        .join(", ");
      const newHistory = pushManualEdit(
        editHistory,
        codeForAi,
        updatedCode,
        remaining,
        description
      );
      onCodeUpdate(updatedCode, newHistory);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setApplyError("Request timed out. Try again.");
        setTimeout(() => setApplyError(null), 4000);
      } else {
        console.error("Style edit error:", err);
        setApplyError("Something went wrong. Try again.");
        setTimeout(() => setApplyError(null), 4000);
      }
    } finally {
      clearTimeout(timeout);
      if (applyTimerRef.current) clearInterval(applyTimerRef.current);
      applyTimerRef.current = null;
      applyAbortRef.current = null;
      setIsApplying(false);
    }
  }, [variant.code, editHistory, onCodeUpdate, layoutMd]);

  const handleAnnotationsSubmit = useCallback(async (anns: ElementAnnotation[]) => {
    if (!onCodeUpdate || anns.length === 0) return;
    applyAbortRef.current?.abort();
    const abort = new AbortController();
    applyAbortRef.current = abort;
    const timeout = setTimeout(() => abort.abort(), 120_000);
    setIsApplying(true);
    setApplyError(null);
    setApplyElapsed(0);
    applyTimerRef.current = setInterval(() => setApplyElapsed((t) => t + 1), 1000);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const storedKey = getStoredApiKey();
      if (storedKey) headers["X-Api-Key"] = storedKey;

      const res = await fetch("/api/generate/apply-edits", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: variant.code,
          annotations: anns,
          layoutMd,
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Request failed" }));
        const msg = errData.error || `Failed (${res.status})`;
        console.error("Annotation edit failed:", msg);
        setApplyError(msg);
        setTimeout(() => setApplyError(null), 6000);
        return;
      }

      const { code: updatedCode } = await res.json();
      const description = anns.map((a) => `${a.elementTag}: "${a.note}"`).join("; ");
      const newHistory = pushAiEdit(
        editHistory,
        variant.code,
        updatedCode,
        anns,
        description
      );
      onCodeUpdate(updatedCode, newHistory);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setApplyError("Request timed out. Try again.");
        setTimeout(() => setApplyError(null), 4000);
      } else {
        console.error("Annotation edit error:", err);
        setApplyError("Something went wrong. Try again.");
        setTimeout(() => setApplyError(null), 4000);
      }
    } finally {
      clearTimeout(timeout);
      if (applyTimerRef.current) clearInterval(applyTimerRef.current);
      applyTimerRef.current = null;
      applyAbortRef.current = null;
      setIsApplying(false);
    }
  }, [variant.code, editHistory, onCodeUpdate, layoutMd]);

  const handleImageGenerated = useCallback(
    (prompt: string, imageUrl: string, context?: { alt?: string; currentSrc?: string; className?: string }) => {
      if (!onCodeUpdate) return;

      const code = variant.code;
      const promptLower = prompt.toLowerCase().trim();

      // Collect all <img> tags with positions
      const imgTagRe = /<img\b[^]*?\/?\s*>/gi;
      const allImgs: { start: number; end: number; tag: string }[] = [];
      let m: RegExpExecArray | null;
      while ((m = imgTagRe.exec(code)) !== null) {
        allImgs.push({ start: m.index, end: m.index + m[0].length, tag: m[0] });
      }

      if (allImgs.length === 0) {
        console.warn("[handleImageGenerated] No img tags found in variant code");
        return;
      }

      // Helper: replace src in a matched img tag and persist
      const applySrc = (match: { start: number; end: number; tag: string }) => {
        // Strip ALL existing src attributes (handles duplicates from pipeline fallbacks)
        let newTag = match.tag
          .replace(/\ssrc\s*=\s*"[^"]*"/gi, "")
          .replace(/\ssrc\s*=\s*'[^']*'/gi, "")
          .replace(/\ssrc\s*=\s*\{[^}]*\}/gi, "");
        // Add single clean src attribute before the closing
        newTag = newTag.replace(/\/?\s*>$/, ` src="${imageUrl}" />`);
        const updatedCode = code.slice(0, match.start) + newTag + code.slice(match.end);
        onCodeUpdate(updatedCode, editHistory);
      };

      // Strategy 1: Match by prompt text inside the tag (data-generate-image="...")
      const byPrompt = allImgs.find((img) => {
        const lower = img.tag.toLowerCase();
        return lower.includes(promptLower) ||
          (promptLower.length > 25 && lower.includes(promptLower.slice(0, 25)));
      });
      if (byPrompt) { applySrc(byPrompt); return; }

      // Strategy 2: Match by the current src the Inspector saw
      if (context?.currentSrc) {
        const srcFragment = context.currentSrc.replace(/^https?:\/\//, "").split("?")[0];
        const bySrc = allImgs.find((img) => img.tag.includes(srcFragment));
        if (bySrc) { applySrc(bySrc); return; }

        // Match placeholder SVG src
        if (context.currentSrc.startsWith("data:image/svg+xml,")) {
          const byPlaceholder = allImgs.find((img) => img.tag.includes("data:image/svg+xml,"));
          if (byPlaceholder) { applySrc(byPlaceholder); return; }
        }
      }

      // Strategy 3: Match by alt text
      if (context?.alt) {
        const altLower = context.alt.toLowerCase();
        const byAlt = allImgs.find((img) => {
          const altMatch = img.tag.match(/alt=["']([^"']+)["']/i);
          return altMatch && altMatch[1].toLowerCase() === altLower;
        });
        if (byAlt) { applySrc(byAlt); return; }
      }

      // Strategy 4: Match by className
      if (context?.className) {
        const classes = context.className.split(/\s+/).filter(Boolean).slice(0, 3);
        if (classes.length > 0) {
          const byClass = allImgs.find((img) =>
            classes.every((cls) => img.tag.includes(cls))
          );
          if (byClass) { applySrc(byClass); return; }
        }
      }

      // Strategy 5: First img with a placeholder SVG src
      const byPlaceholderSvg = allImgs.find((img) => img.tag.includes("data:image/svg+xml,"));
      if (byPlaceholderSvg) { applySrc(byPlaceholderSvg); return; }

      // Strategy 6: First img with a known placeholder domain or relative path
      const placeholderDomains = /(?:placehold\.co|placeholder\.com|unsplash\.com|picsum\.photos|pravatar\.cc|randomuser\.me|ui-avatars\.com|robohash\.org)/i;
      const byPlaceholderUrl = allImgs.find((img) => placeholderDomains.test(img.tag));
      if (byPlaceholderUrl) { applySrc(byPlaceholderUrl); return; }

      const byRelativeSrc = allImgs.find((img) => /src=["']\/[^"'\s>]+["']/i.test(img.tag));
      if (byRelativeSrc) { applySrc(byRelativeSrc); return; }

      // Final fallback: update the first img tag (better to save than lose the image)
      applySrc(allImgs[0]);
    },
    [variant.code, editHistory, onCodeUpdate]
  );

  const handleHistoryRestore = useCallback((entry: EditEntry) => {
    if (!onCodeUpdate) return;
    const newHistory = pushRollback(editHistory, variant.code, entry);
    onCodeUpdate(entry.codeAfter, newHistory);
    setPreviewEntryId(undefined);
  }, [variant.code, editHistory, onCodeUpdate]);

  const handleHistoryPreview = useCallback(async (entry: EditEntry) => {
    setPreviewEntryId(entry.id);
    // Temporarily render the historical code in the iframe
    try {
      const res = await fetch("/api/transpile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sanitizeRelativeSrc(entry.codeAfter) }),
      });
      if (!res.ok) return;
      const { js } = await res.json();
      const componentName = extractComponentName(entry.codeAfter);
      const srcdoc = buildSrcdoc(js, componentName, { iconPacks, fonts, uploadedFonts, cssTokenBlock });
      if (iframeRef.current) {
        iframeRef.current.srcdoc = srcdoc;
      }
    } catch {
      // silently fail preview
    }
  }, []);

  const toggleInspectMode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectMode((prev) => !prev);
    setPreviewEntryId(undefined);
  }, []);

  const healthBadge = variant.healthScore ? (() => {
    const hs = variant.healthScore;

    // Group issues by rule
    const ruleGroups = new Map<string, Array<{ actual: string; expected: string; severity: string }>>();
    for (const issue of hs.issues) {
      const group = ruleGroups.get(issue.rule) ?? [];
      group.push({ actual: issue.actual, expected: issue.expected, severity: issue.severity });
      ruleGroups.set(issue.rule, group);
    }

    const ruleLines = [...ruleGroups.entries()]
      .map(([rule, issues]) => {
        const severity = issues.some(i => i.severity === "error") ? "\u2718" : "\u26A0";
        return `  ${severity} ${rule} (${issues.length})`;
      })
      .join("\n");

    const passCount = hs.total >= 80 ? "Strong" : hs.total >= 50 ? "Moderate" : "Needs work";
    const label = `Design system compliance: ${hs.total}/100 (${passCount})\n\nMetrics:\n  Token faithfulness: ${hs.tokenFaithfulness}\n  Component accuracy: ${hs.componentAccuracy}\n  Anti-pattern violations: ${hs.antiPatternViolations}${ruleGroups.size > 0 ? `\n\nIssues by rule:\n${ruleLines}` : "\n\nNo issues found \u2714"}`;
    return (
      <Tip label={label} wide>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold cursor-help ${
            hs.total >= 80
              ? "bg-[var(--status-success)]/20 text-[var(--status-success)]"
              : hs.total >= 50
                ? "bg-[var(--status-warning)]/20 text-[var(--status-warning)]"
                : "bg-[var(--status-error)]/20 text-[var(--status-error)]"
          }`}
        >
          {hs.total}
        </span>
      </Tip>
    );
  })() : null;

  return (
    <TooltipProvider>
    <div
      onClick={inspectMode ? undefined : onSelect}
      style={isNewlyGenerated ? {
        clipPath: revealed ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
        transition: "clip-path 800ms ease-out",
      } : undefined}
      className={`group relative flex flex-col rounded-xl border transition-colors ${inspectMode ? "" : "cursor-pointer"} ${
        isSelected
          ? "border-[var(--studio-accent)] ring-1 ring-[var(--studio-accent)]/30 bg-[var(--bg-elevated)]"
          : "border-[var(--studio-border)] bg-[var(--bg-surface)] hover:border-[var(--studio-border-strong)]"
      }`}
    >
      {/* Selection indicator */}
      {isSelected && !inspectMode && (
        <div className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--studio-accent)]">
          <Check size={12} className="text-[var(--text-on-accent)]" />
        </div>
      )}

      {/* Inspect mode indicator */}
      {inspectMode && (
        <div className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
          <MousePointer2 size={10} className="text-white" />
        </div>
      )}

      {/* Applying overlay */}
      {isApplying && (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-xl bg-black/40">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--studio-border)] px-3 py-2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
            <span className="text-[10px] text-[var(--text-secondary)]">Applying changes{applyElapsed > 0 ? ` ${applyElapsed}s` : "..."}</span>
          </div>
        </div>
      )}

      {/* Preview area */}
      <div
        ref={previewContainerRef}
        className="relative aspect-[4/3] overflow-y-auto overflow-x-hidden rounded-t-xl bg-white"
      >
        {previewError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
            <div className="rounded-full bg-[var(--status-error)]/10 p-2.5">
              <AlertTriangle size={18} className="text-[var(--status-error)]" />
            </div>
            <p className="text-xs font-medium text-[var(--text-primary)]">Failed to render</p>
            <p className="max-w-[220px] text-center text-[10px] leading-relaxed text-[var(--status-error)]/70 line-clamp-2">{previewError.split("\n")[0]}</p>
            {previewError.includes("\n") && (
              <details
                className="max-w-[220px] text-[10px] leading-relaxed text-[var(--text-muted)]"
                onClick={(e) => e.stopPropagation()}
              >
                <summary className="cursor-pointer text-center hover:text-[var(--text-secondary)]">Show details</summary>
                <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-[var(--bg-hover)] p-2 text-left">{previewError}</pre>
              </details>
            )}
            {isTransientPreviewError(previewError) ? (
              <button
                onClick={(e) => { e.stopPropagation(); setRetryKey((k) => k + 1); }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-hover)] px-3 py-1.5 text-[11px] text-[var(--text-primary)] transition-all hover:bg-[var(--studio-accent)] hover:text-[var(--text-on-accent)]"
              >
                <RotateCw size={12} />
                Retry render
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setCodePaneOpen(true); setInspectMode(true); }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-hover)] px-3 py-1.5 text-[11px] text-[var(--text-primary)] transition-all hover:bg-[var(--studio-accent)] hover:text-[var(--text-on-accent)]"
              >
                <Code2 size={12} />
                View code
              </button>
            )}
          </div>
        ) : inspectMode ? (
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts allow-same-origin"
            className={`w-full h-full border-0 transition-opacity ${previewReady ? "opacity-100" : "opacity-0"}`}
            style={{ pointerEvents: "auto" }}
            title={`Preview: ${variant.name}`}
          />
        ) : (
          <div style={{ height: contentHeight != null ? contentHeight * 0.5 : "100%", overflow: "hidden" }}>
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-same-origin"
              onLoad={measureContentHeight}
              className={`w-full origin-top-left scale-50 border-0 transition-opacity ${previewReady ? "opacity-100" : "opacity-0"}`}
              style={{ width: "200%", height: contentHeight != null ? `${contentHeight}px` : "200%", pointerEvents: "none" }}
              title={`Preview: ${variant.name}`}
            />
          </div>
        )}
        {!previewReady && !previewError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
          </div>
        )}
      </div>

      {/* Full-screen inspector overlay — portalled to document body */}
      {inspectMode && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex bg-[var(--bg-app)]">
          {/* Main preview area */}
          <div ref={fullscreenContainerRef} className="relative flex-1 pt-10">
            <iframe
              ref={fullscreenIframeRef}
              sandbox="allow-scripts allow-same-origin"
              className="h-full w-full border-0"
              style={{ pointerEvents: "auto" }}
              title={`Inspector: ${variant.name}`}
            />

            {/* Inspector popover */}
            <ElementInspector
              iframeRef={fullscreenIframeRef}
              containerRef={fullscreenContainerRef}
              isActive={inspectMode}
              onStyleEdits={handleStyleEdits}
              onAnnotationsSubmit={handleAnnotationsSubmit}
              onImageGenerated={handleImageGenerated}
              onDeselect={() => {}}
              onReset={() => {
                const js = transpiledJsRef.current;
                if (!js) return;
                const srcdoc = buildSrcdoc(js, componentNameRef.current, { inspectorScript: getInspectorScript(), iconPacks, fonts, uploadedFonts, cssTokenBlock });
                if (fullscreenIframeRef.current) fullscreenIframeRef.current.srcdoc = srcdoc;
              }}
              designTokens={designTokens}
              brandingAssets={brandingAssets}
              iframeScale={1}
            />

            {/* Applying overlay */}
            {(isApplying || applyError) && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
                <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--studio-border)] px-4 py-3">
                  {applyError ? (
                    <span className="text-xs text-[var(--status-error)]">{applyError}</span>
                  ) : (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
                      <span className="text-xs text-[var(--text-secondary)]">Applying changes{applyElapsed > 0 ? ` ${applyElapsed}s` : "..."}</span>
                      <button
                        onClick={() => applyAbortRef.current?.abort()}
                        className="ml-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between border-b border-[var(--studio-border)] bg-[var(--bg-panel)]/95 backdrop-blur-sm px-4 py-2">
            <div className="flex items-center gap-2">
              <MousePointer2 size={14} className="text-indigo-400" />
              <span className="text-xs font-medium text-[var(--text-primary)]">
                Inspector — {variant.name}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Click any element to inspect and edit
              </span>
            </div>
            {onRegenerateImages && (placeholderImageCount > 0 || isProcessingImages) && (
              <button
                onClick={(e) => { e.stopPropagation(); onRegenerateImages(false); }}
                disabled={isProcessingImages}
                className="flex items-center gap-1.5 rounded-md bg-[var(--studio-accent)] px-3 py-1.5 text-xs font-medium text-[var(--text-on-accent)] hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isProcessingImages ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--text-on-accent)]/30 border-t-[var(--text-on-accent)]" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImagePlus size={12} />
                    Generate images ({placeholderImageCount})
                  </>
                )}
              </button>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setCodePaneOpen((v) => !v); }}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  codePaneOpen
                    ? "border-[var(--studio-accent)] bg-[var(--studio-accent-subtle)] text-[var(--text-primary)]"
                    : "border-[var(--studio-border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <Code2 size={12} />
                Code
              </button>
              <button
                onClick={(e) => { e.preventDefault(); toggleInspectMode(e); }}
                className="flex items-center gap-1.5 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <X size={12} />
                Exit Inspector
              </button>
            </div>
          </div>

          {/* Code pane (split view) */}
          {codePaneOpen && (
            <>
              <div
                onPointerDown={handleResizePointerDown}
                className="w-1 shrink-0 cursor-col-resize bg-[var(--studio-border)] hover:bg-[var(--studio-border-strong)] transition-colors"
                title="Drag to resize"
              />
              <div
                className="shrink-0 border-l border-[var(--studio-border)] bg-[var(--bg-panel)] pt-12"
                style={{ width: codePaneWidth }}
              >
                <VariantCodeEditor
                  value={variant.code}
                  onChange={handleCodeEdit}
                  errorAt={transpileErrorPos}
                />
              </div>
            </>
          )}

          {/* Edit history sidebar */}
          {editHistory.length > 0 && (
            <div className="w-[240px] border-l border-[var(--studio-border)] bg-[var(--bg-panel)] overflow-y-auto pt-12">
              <EditHistoryPanel
                history={editHistory}
                onRestore={handleHistoryRestore}
                onPreview={handleHistoryPreview}
                currentPreviewId={previewEntryId}
              />
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
            {variant.name}
          </h3>
          <div className="flex items-center gap-1">
            {editHistory.length > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[9px] text-indigo-400">
                {editHistory.length} edit{editHistory.length !== 1 ? "s" : ""}
              </span>
            )}
            {healthBadge}
          </div>
        </div>
        {variant.rationale && (
          <Tip label={variant.rationale} wide>
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 cursor-default">
              {variant.rationale}
            </p>
          </Tip>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 border-t border-[var(--studio-border)] px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tip label="Good">
        <button
          onClick={(e) => { e.stopPropagation(); onRate("up"); }}
          className={`rounded p-1 transition-colors ${
            variant.rating === "up"
              ? "text-[var(--status-success)] bg-[var(--status-success)]/10"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          <ThumbsUp size={12} />
        </button>
        </Tip>
        <Tip label="Bad">
        <button
          onClick={(e) => { e.stopPropagation(); onRate("down"); }}
          className={`rounded p-1 transition-colors ${
            variant.rating === "down"
              ? "text-red-400 bg-red-500/10"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          <ThumbsDown size={12} />
        </button>
        </Tip>
        {onDelete && isSelected && (
          <Tip label="Delete variant">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
          </Tip>
        )}
        <div className="flex-1" />

        {/* Inspect mode toggle */}
        {onCodeUpdate && (
          <Tip label={inspectMode ? "Exit inspect mode" : "Inspect & edit"}>
          <button
            onClick={toggleInspectMode}
            className={`rounded p-1 transition-colors ${
              inspectMode
                ? "text-indigo-400 bg-indigo-500/10"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <MousePointer2 size={12} />
          </button>
          </Tip>
        )}

        <Tip label="Copy code">
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Copy size={12} />
        </button>
        </Tip>
        {onViewComparison && comparisonCount > 0 && (
          <Tip label={`View comparison${comparisonCount > 1 ? "s" : ""}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onViewComparison(); }}
            className="relative rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <GitCompareArrows size={12} />
            {comparisonCount > 1 && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--studio-accent)] text-[7px] font-bold text-[var(--text-on-accent)]">
                {comparisonCount}
              </span>
            )}
          </button>
          </Tip>
        )}
        {onRegenerateImages && (
          <Tip label={variant.code.includes("data-generate-image") ? "Generate images (Shift+click: regenerate all)" : "No images to generate"}>
          <button
            onClick={(e) => { e.stopPropagation(); if (variant.code.includes("data-generate-image")) onRegenerateImages(e.shiftKey); }}
            disabled={isProcessingImages || !variant.code.includes("data-generate-image")}
            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
          >
            <ImagePlus size={12} />
          </button>
          </Tip>
        )}
        <Tip label="Regenerate with feedback">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowRefineInput(!showRefineInput);
            setRefineText("");
            setTimeout(() => refineInputRef.current?.focus(), 50);
          }}
          className={`rounded p-1 transition-colors ${
            showRefineInput
              ? "text-[var(--status-warning)] bg-[var(--status-warning)]/10"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          <RotateCw size={12} />
        </button>
        </Tip>
        {onResponsive && (
          <Tip label="Responsive preview">
          <button
            onClick={(e) => { e.stopPropagation(); onResponsive(); }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Monitor size={12} />
          </button>
          </Tip>
        )}
        <Tip label="Push to Figma">
        <button
          onClick={(e) => { e.stopPropagation(); onPushToFigma(); }}
          className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Figma size={12} />
        </button>
        </Tip>
        <Tip label="Push to Paper">
        <button
          onClick={(e) => { e.stopPropagation(); onPushToPaper(); }}
          className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <PaperIcon size={12} />
        </button>
        </Tip>
        {onPromoteToLibrary && (
          <Tip label="Add to Library">
          <button
            onClick={(e) => { e.stopPropagation(); onPromoteToLibrary(); }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <BookMarked size={12} />
          </button>
          </Tip>
        )}
      </div>

      {/* Inline refine input */}
      {showRefineInput && (
        <div
          className="flex items-center gap-1.5 border-t border-[var(--status-warning)]/20 bg-[var(--status-warning)]/5 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={refineInputRef}
            type="text"
            placeholder="What to change... (Enter to submit, empty = regenerate as-is)"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRegenerate(refineText.trim() || undefined);
                setShowRefineInput(false);
                setRefineText("");
              }
              if (e.key === "Escape") {
                setShowRefineInput(false);
                setRefineText("");
              }
            }}
            className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--status-warning)]/40 outline-none"
          />
          <button
            onClick={() => {
              onRegenerate(refineText.trim() || undefined);
              setShowRefineInput(false);
              setRefineText("");
            }}
            className="shrink-0 flex items-center justify-center size-5 rounded-full bg-[var(--status-warning)]/20 text-[var(--status-warning)] hover:bg-[var(--status-warning)]/30 transition-colors"
          >
            <ArrowUp size={10} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Edit History */}
      {editHistory.length > 0 && (
        <EditHistoryPanel
          history={editHistory}
          onRestore={handleHistoryRestore}
          onPreview={handleHistoryPreview}
          currentPreviewId={previewEntryId}
        />
      )}
    </div>
    </TooltipProvider>
  );
}
