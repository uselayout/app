"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, ThumbsUp, ThumbsDown, Copy, RotateCw, Figma, Monitor, BookMarked, ArrowUp, ImagePlus, GitCompareArrows, Trash2, MousePointer2, X } from "lucide-react";
import { extractComponentName, buildSrcdoc, sanitizeRelativeSrc } from "@/lib/explore/preview-helpers";
import { getInspectorScript } from "@/lib/explore/inspector-script";
import { pushManualEdit, pushAiEdit, pushRollback, undoLastEdit } from "@/lib/explore/edit-history";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ElementInspector } from "@/components/studio/ElementInspector";
import { EditHistoryPanel } from "@/components/studio/EditHistoryPanel";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { countPlaceholderImages } from "@/lib/image/placeholder";
import type { DesignVariant, StyleEdit, EditEntry, EditHistory, ElementAnnotation, ExtractedToken } from "@/lib/types";

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

/** Tailwind class prefix patterns for each CSS property (for removal) */
const TAILWIND_PREFIXES: Record<string, RegExp> = {
  fontWeight: /\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[\d+\])\b/g,
  fontSize: /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[[^\]]+\])\b/g,
  lineHeight: /\bleading-(?:none|tight|snug|normal|relaxed|loose|\[[^\]]+\])\b/g,
  letterSpacing: /\btracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])\b/g,
  fontFamily: /\bfont-(?:sans|serif|mono|\[[^\]]+\])\b/g,
  textAlign: /\btext-(?:left|center|right|justify)\b/g,
  display: /\b(?:block|flex|grid|inline|inline-flex|inline-block|hidden)\b/g,
  flexDirection: /\bflex-(?:row|col|row-reverse|col-reverse)\b/g,
  alignItems: /\bitems-(?:start|end|center|baseline|stretch)\b/g,
  justifyContent: /\bjustify-(?:start|end|center|between|around|evenly)\b/g,
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
 * Build a regex that finds a className attribute in source code matching the given
 * DOM classes, tolerating whitespace differences (multiline classNames, indentation).
 * Also handles className={"..."} and className={'...'} JSX expressions.
 */
function buildClassNameRegex(elementClasses: string): RegExp | null {
  const classWords = elementClasses.split(/\s+/).filter(Boolean).slice(0, 8);
  if (classWords.length === 0) return null;
  const escapedWords = classWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const flexibleSnippet = escapedWords.join("[\\s]+");
  // Match className="...", className='...', className={"..."}, className={'...'}
  return new RegExp(
    `className=(?:["']|\\{["'])([^"']*${flexibleSnippet}[^"']*)(?:["']|["']\\})`,
    "s",
  );
}

/**
 * Try to apply a single style edit directly in the source code by swapping Tailwind classes.
 * Returns the updated code, or null if direct editing isn't possible for this edit.
 */
function tryDirectStyleEditSingle(code: string, edit: StyleEdit): string | null {
  const { elementClasses, property, after } = edit;
  if (!elementClasses || !CSS_TO_TAILWIND[property]) return null;

  const classRegex = buildClassNameRegex(elementClasses);
  if (!classRegex) return null;

  const classMatch = code.match(classRegex);
  if (!classMatch) return null;

  const fullClassName = classMatch[1];
  const prefix = TAILWIND_PREFIXES[property];
  const newClass = CSS_TO_TAILWIND[property](after);

  // Remove existing class for this property, add new one
  let updatedClassName = fullClassName;
  if (prefix) {
    updatedClassName = updatedClassName.replace(prefix, "").replace(/\s{2,}/g, " ").trim();
  }
  updatedClassName = `${updatedClassName} ${newClass}`;

  const result = code.replace(classMatch[0], `className="${updatedClassName}"`);
  return result !== code ? result : null;
}

/**
 * Try to apply style edits directly in the source code by swapping Tailwind classes.
 * Returns { code, remaining } where remaining are edits that couldn't be applied directly.
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

function Tip({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <TooltipPrimitive.Root delayDuration={wide ? 300 : undefined}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          sideOffset={6}
          className={`z-50 rounded-md bg-[var(--bg-elevated)] border border-[var(--studio-border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] animate-in fade-in-0 zoom-in-95 ${wide ? "max-w-xs whitespace-normal leading-relaxed" : ""}`}
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
  iconPacks?: string[];
}

export function VariantCard({
  variant,
  isSelected,
  onSelect,
  onRate,
  onCopyCode,
  onPushToFigma,
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
  iconPacks,
}: VariantCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const transpiledJsRef = useRef<string | null>(null);
  const componentNameRef = useRef<string>("");
  const refineInputRef = useRef<HTMLInputElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [inspectMode, setInspectMode] = useState(false);
  const placeholderImageCount = useMemo(() => countPlaceholderImages(variant.code), [variant.code]);
  const [isApplying, setIsApplying] = useState(false);
  const [applyElapsed, setApplyElapsed] = useState(0);
  const [applyError, setApplyError] = useState<string | null>(null);
  const applyAbortRef = useRef<AbortController | null>(null);
  const applyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [previewEntryId, setPreviewEntryId] = useState<string | undefined>();
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const editHistory = variant.editHistory ?? [];

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
          setPreviewError("Transpilation failed");
          return;
        }

        const { js } = await res.json();
        if (cancelled) return;

        const name = extractComponentName(variant.code);
        transpiledJsRef.current = js;
        componentNameRef.current = name;

        // Update the scaled card preview
        const srcdoc = buildSrcdoc(js, name, undefined, variant.id, iconPacks);
        if (iframeRef.current) {
          iframeRef.current.srcdoc = srcdoc;
          setPreviewReady(true);
        }

        // Also update the fullscreen Inspector iframe if it's open
        if (inspectMode && fullscreenIframeRef.current) {
          const inspectorSrcdoc = buildSrcdoc(js, name, getInspectorScript(), undefined, iconPacks);
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
  }, [variant.code, inspectMode]);

  // Rebuild srcdoc when inspectMode toggles (no re-transpile, instant)
  useEffect(() => {
    const js = transpiledJsRef.current;
    if (!js) return;
    if (inspectMode) {
      // Fullscreen iframe gets the inspector script
      const srcdoc = buildSrcdoc(js, componentNameRef.current, getInspectorScript(), undefined, iconPacks);
      if (fullscreenIframeRef.current) {
        fullscreenIframeRef.current.srcdoc = srcdoc;
      }
    } else {
      // Exiting inspect mode — React mounts a fresh scaled iframe, restore its srcdoc
      const srcdoc = buildSrcdoc(js, componentNameRef.current, undefined, variant.id, iconPacks);
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
    const timeout = setTimeout(() => abort.abort(), 60_000);
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
    const timeout = setTimeout(() => abort.abort(), 60_000);
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
        let newTag = match.tag;
        if (/\ssrc\s*=\s*"[^"]*"/i.test(newTag)) {
          newTag = newTag.replace(/\ssrc\s*=\s*"[^"]*"/i, ` src="${imageUrl}"`);
        } else if (/\ssrc\s*=\s*'[^']*'/i.test(newTag)) {
          newTag = newTag.replace(/\ssrc\s*=\s*'[^']*'/i, ` src="${imageUrl}"`);
        } else {
          newTag = newTag.replace(/\/?\s*>$/, ` src="${imageUrl}" />`);
        }
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
      const srcdoc = buildSrcdoc(js, componentName, undefined, undefined, iconPacks);
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

  const healthBadge = variant.healthScore ? (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        variant.healthScore.total >= 80
          ? "bg-emerald-500/20 text-emerald-400"
          : variant.healthScore.total >= 50
            ? "bg-amber-500/20 text-amber-400"
            : "bg-red-500/20 text-red-400"
      }`}
    >
      {variant.healthScore.total}
    </span>
  ) : null;

  return (
    <TooltipProvider>
    <div
      onClick={inspectMode ? undefined : onSelect}
      className={`group relative flex flex-col rounded-xl border transition-all ${inspectMode ? "" : "cursor-pointer"} ${
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
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-xs text-red-400">{previewError}</p>
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
                const srcdoc = buildSrcdoc(js, componentNameRef.current, getInspectorScript(), undefined, iconPacks);
                if (fullscreenIframeRef.current) fullscreenIframeRef.current.srcdoc = srcdoc;
              }}
              designTokens={designTokens}
              iframeScale={1}
            />

            {/* Applying overlay */}
            {(isApplying || applyError) && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
                <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--studio-border)] px-4 py-3">
                  {applyError ? (
                    <span className="text-xs text-red-400">{applyError}</span>
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
            <button
              onClick={toggleInspectMode}
              className="flex items-center gap-1.5 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X size={12} />
              Exit Inspector
            </button>
          </div>

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
              ? "text-emerald-400 bg-emerald-500/10"
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
          <Tip label="Generate images (Shift+click: regenerate all)">
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerateImages(e.shiftKey); }}
            disabled={isProcessingImages}
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
              ? "text-amber-400 bg-amber-500/10"
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
          className="flex items-center gap-1.5 border-t border-amber-500/20 bg-amber-500/5 px-3 py-2"
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
            className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-amber-400/40 outline-none"
          />
          <button
            onClick={() => {
              onRegenerate(refineText.trim() || undefined);
              setShowRefineInput(false);
              setRefineText("");
            }}
            className="shrink-0 flex items-center justify-center size-5 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
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
