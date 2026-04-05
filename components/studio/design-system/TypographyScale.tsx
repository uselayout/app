"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, Copy, Check } from "lucide-react";
import type { ExtractedToken, FontDeclaration, UploadedFont } from "@/lib/types";
import { groupTokensByPurpose } from "@/lib/tokens/group-tokens";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { buildFontTags } from "@/lib/explore/font-loader";

interface TypographyScaleProps {
  tokens: ExtractedToken[];
  onUpdateToken: (name: string, value: string) => void;
  onRemoveToken: (name: string) => void;
  extractedFonts: FontDeclaration[];
  uploadedFonts?: UploadedFont[];
}

function parseNumericValue(value: string): number | null {
  const match = value.match(/^([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/** Check if a token value is renderable as a typography specimen */
function isRenderableTypography(name: string, value: string): boolean {
  // var() references are not renderable
  if (value.startsWith("var(")) return false;
  // Font families (comma-separated list or quoted name)
  if (name.includes("font-family") || name.includes("font-sans") || name.includes("font-mono") || name.includes("font-serif")) return true;
  // Font sizes with numeric values
  if ((name.includes("size") || name.includes("font-size")) && parseNumericValue(value) !== null) return true;
  // Font weights
  if (name.includes("weight") && parseNumericValue(value) !== null) return true;
  // Line heights
  if ((name.includes("line-height") || name.includes("leading")) && value.match(/[\d.]/)) return true;
  // Letter spacing
  if (name.includes("letter-spacing") || name.includes("tracking")) return true;
  // Font stacks (contain commas, likely a font family list)
  if (value.includes(",") && !value.includes("(")) return true;
  return false;
}

function TypographySpecimenRow({
  token,
  onUpdate,
  onRemove,
}: {
  token: ExtractedToken;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(token.value);
  const [justCopied, setJustCopied] = useState(false);

  const displayName = token.cssVariable ?? `--${token.name}`;
  const isFontSize = token.name.includes("size") || token.name.includes("font-size");
  const isFontFamily = token.name.includes("font-family") || token.name.includes("font-sans") || token.name.includes("font-mono") || token.name.includes("font-serif") || (token.value.includes(",") && !token.value.includes("("));
  const isFontWeight = token.name.includes("weight");
  const isLineHeight = token.name.includes("line-height") || token.name.includes("leading");

  const numericValue = parseNumericValue(token.value);

  const specimenStyle: React.CSSProperties = {};
  if (isFontSize && numericValue) {
    specimenStyle.fontSize = `${Math.min(numericValue, 48)}px`;
  } else if (isFontFamily) {
    specimenStyle.fontFamily = token.value;
  } else if (isFontWeight && numericValue) {
    specimenStyle.fontWeight = numericValue;
    specimenStyle.fontSize = "18px";
  } else if (isLineHeight) {
    specimenStyle.lineHeight = token.value;
    specimenStyle.fontSize = "16px";
  }

  const handleCopy = useCallback(() => {
    copyToClipboard(displayName);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }, [displayName]);

  const handleCommit = useCallback(() => {
    setEditing(false);
    if (editValue.trim() && editValue !== token.value) {
      onUpdate(editValue.trim());
    } else {
      setEditValue(token.value);
    }
  }, [editValue, token.value, onUpdate]);

  return (
    <div className="group flex items-start gap-4 rounded-lg px-3 py-2.5 hover:bg-[var(--bg-surface)] transition-colors">
      <div className="w-52 shrink-0 space-y-0.5 overflow-hidden">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {justCopied ? (
            <Check className="h-3 w-3 text-emerald-400 shrink-0" />
          ) : (
            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
          )}
          <span>{displayName.replace(/^--/, "")}</span>
        </button>
        {editing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommit();
              if (e.key === "Escape") {
                setEditValue(token.value);
                setEditing(false);
              }
            }}
            className="w-full rounded border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-primary)] outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-text line-clamp-1"
            title={token.value}
          >
            {token.value}
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-[var(--text-primary)]" style={specimenStyle}>
          {isFontFamily ? "The quick brown fox jumps over the lazy dog" : "Aa Bb Cc 123"}
        </p>
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center h-5 w-5 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Compact row for var() reference tokens that can't be rendered as specimens */
function TypographyReferenceRow({
  token,
  onUpdate,
  onRemove,
}: {
  token: ExtractedToken;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(token.value);
  const [justCopied, setJustCopied] = useState(false);

  const displayName = token.cssVariable ?? `--${token.name}`;

  const handleCopy = useCallback(() => {
    copyToClipboard(displayName);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }, [displayName]);

  const handleCommit = useCallback(() => {
    setEditing(false);
    if (editValue.trim() && editValue !== token.value) {
      onUpdate(editValue.trim());
    } else {
      setEditValue(token.value);
    }
  }, [editValue, token.value, onUpdate]);

  return (
    <div className="group flex items-center gap-3 rounded-md px-3 py-1.5 hover:bg-[var(--bg-surface)] transition-colors">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
      >
        {justCopied ? (
          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
        ) : (
          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
        )}
        <span>{displayName.replace(/^--/, "")}</span>
      </button>

      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommit();
            if (e.key === "Escape") {
              setEditValue(token.value);
              setEditing(false);
            }
          }}
          className="flex-1 rounded border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-primary)] outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="rounded bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-text"
        >
          {token.value}
        </button>
      )}

      <button
        onClick={onRemove}
        className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center h-5 w-5 rounded text-[var(--text-muted)] hover:text-red-400 transition-all ml-auto"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function TypographyScale({
  tokens,
  onUpdateToken,
  onRemoveToken,
  extractedFonts,
  uploadedFonts,
}: TypographyScaleProps) {
  // Load extracted and uploaded fonts into the document so specimens render correctly
  const fontStyleRef = useRef<HTMLStyleElement | null>(null);
  useEffect(() => {
    const { linkTags, fontFaceCSS } = buildFontTags(extractedFonts, uploadedFonts);

    // Inject @font-face rules
    if (fontFaceCSS) {
      const style = document.createElement("style");
      style.setAttribute("data-layout-fonts", "typography-scale");
      style.textContent = fontFaceCSS;
      document.head.appendChild(style);
      fontStyleRef.current = style;
    }

    // Inject Google Fonts <link> tags
    const links: HTMLLinkElement[] = [];
    if (linkTags) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(linkTags, "text/html");
      doc.querySelectorAll("link").forEach((el) => {
        // Avoid duplicates
        const href = el.getAttribute("href");
        if (href && !document.querySelector(`link[href="${href}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = href;
          link.setAttribute("data-layout-fonts", "typography-scale");
          document.head.appendChild(link);
          links.push(link);
        }
      });
    }

    return () => {
      fontStyleRef.current?.remove();
      fontStyleRef.current = null;
      links.forEach((l) => l.remove());
    };
  }, [extractedFonts, uploadedFonts]);

  // Separate renderable specimens from var() reference tokens
  const renderableTokens = tokens.filter((t) => isRenderableTypography(t.name, t.value));
  const referenceTokens = tokens.filter((t) => !isRenderableTypography(t.name, t.value));

  const groups = groupTokensByPurpose(renderableTokens, "typography");
  const displayGroups = groups.length > 0
    ? groups
    : renderableTokens.length > 0
      ? [{ label: "All Typography", tokens: renderableTokens }]
      : [];

  // Sort font-size tokens by numeric value (largest first)
  const sortedGroups = displayGroups.map((group) => {
    if (group.label === "Sizes" || group.label === "Font Sizes") {
      const sorted = [...group.tokens].sort((a, b) => {
        const aVal = parseNumericValue(a.value) ?? 0;
        const bVal = parseNumericValue(b.value) ?? 0;
        return bVal - aVal;
      });
      return { ...group, tokens: sorted };
    }
    return group;
  });

  // Deduplicate extracted fonts by family name
  const uniqueFonts = extractedFonts.reduce<FontDeclaration[]>((acc, font) => {
    if (!acc.some((f) => f.family === font.family)) acc.push(font);
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Font families overview */}
      {uniqueFonts.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Font Families
          </h3>
          <div className="flex flex-wrap gap-3">
            {uniqueFonts.map((font) => (
              <div
                key={font.family}
                className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3"
              >
                <p
                  className="text-lg text-[var(--text-primary)]"
                  style={{ fontFamily: font.family }}
                >
                  {font.family}
                </p>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  {font.weight || "400"} {font.style !== "normal" ? font.style : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renderable specimens */}
      {sortedGroups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {group.label}
          </h3>
          <div className="space-y-0.5">
            {group.tokens.map((token) => (
              <TypographySpecimenRow
                key={token.cssVariable ?? token.name}
                token={token}
                onUpdate={(value) => onUpdateToken(token.name, value)}
                onRemove={() => onRemoveToken(token.name)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Reference tokens (var() values) - compact list */}
      {referenceTokens.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Token References
            <span className="ml-2 opacity-60">{referenceTokens.length}</span>
          </h3>
          <div className="space-y-0.5">
            {referenceTokens.map((token) => (
              <TypographyReferenceRow
                key={token.cssVariable ?? token.name}
                token={token}
                onUpdate={(value) => onUpdateToken(token.name, value)}
                onRemove={() => onRemoveToken(token.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
