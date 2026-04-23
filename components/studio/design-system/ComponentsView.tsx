"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import type { ExtractedComponent, ScannedComponent } from "@/lib/types";

interface ComponentsViewProps {
  extractedComponents: ExtractedComponent[];
  scannedComponents: ScannedComponent[];
  /** Source of the design-side inventory. Drives the "Design" column label. */
  extractionSource?: "figma" | "website";
}

interface MergedComponent {
  name: string;
  design: ExtractedComponent | null;
  code: ScannedComponent | null;
  matchConfidence: number;
}

export function ComponentsView({
  extractedComponents,
  scannedComponents,
  extractionSource,
}: ComponentsViewProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const designLabel = extractionSource === "figma" ? "Figma" : "Design";

  const handleCopyImport = (name: string, rawPath: string) => {
    const importPath = rawPath.startsWith("src/") ? "@/" + rawPath.slice(4) : rawPath;
    const importStatement = `import { ${name} } from '${importPath}'`;
    copyToClipboard(importStatement);
    setCopiedPath(`${name}::${importPath}`);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  const merged = useMemo(() => {
    const result: MergedComponent[] = [];
    const usedScanned = new Set<string>();

    const filteredExtracted = extractedComponents.filter(
      (c) => !c.name.toLowerCase().startsWith("icon/") && !c.name.toLowerCase().startsWith("icon\\")
    );

    for (const design of filteredExtracted) {
      const match = scannedComponents.find(
        (s) =>
          s.designSystemMatch?.toLowerCase() === design.name.toLowerCase() ||
          s.name.toLowerCase() === design.name.toLowerCase()
      );
      if (match) usedScanned.add(match.filePath);
      result.push({
        name: design.name,
        design,
        code: match ?? null,
        matchConfidence: match?.matchConfidence ?? 0,
      });
    }

    for (const code of scannedComponents) {
      if (!usedScanned.has(code.filePath) && !result.some((r) => r.code?.filePath === code.filePath)) {
        result.push({
          name: code.name,
          design: null,
          code,
          matchConfidence: 0,
        });
      }
    }

    return result.sort((a, b) => {
      const aScore = a.design && a.code ? 2 : a.design ? 1 : 0;
      const bScore = b.design && b.code ? 2 : b.design ? 1 : 0;
      return bScore - aScore;
    });
  }, [extractedComponents, scannedComponents]);

  if (merged.length === 0) {
    return (
      <p className="text-xs text-[var(--text-muted)] px-1">
        No components found. Extract from Figma or run{" "}
        <code className="text-[10px] font-mono bg-[var(--bg-elevated)] px-1 py-0.5 rounded">
          layout scan --sync
        </code>{" "}
        in your project.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_60px_60px_1fr_20px] gap-2 px-2 py-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Component
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] text-center">
          {designLabel}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] text-center">
          Code
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Details
        </span>
        <span />
      </div>

      {merged.map((comp) => (
        <div
          key={comp.name + (comp.code?.filePath ?? "")}
          className="group grid grid-cols-[1fr_60px_60px_1fr_20px] gap-2 items-center rounded px-2 py-1.5 hover:bg-[var(--bg-hover)] transition-colors"
        >
          <span className="text-xs font-medium text-[var(--text-primary)] truncate">
            {comp.name}
          </span>

          <span className="flex justify-center">
            {comp.design ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-30" />
            )}
          </span>

          <span className="flex justify-center">
            {comp.code ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-30" />
            )}
          </span>

          <div className="min-w-0">
            {comp.code && (
              <span
                className="text-[10px] text-[var(--text-muted)] truncate block"
                title={comp.code.filePath}
              >
                {comp.code.filePath}
              </span>
            )}
            {comp.design && !comp.code && (
              <span className="text-[10px] text-[var(--status-warning)]/70">Not built yet</span>
            )}
            {comp.code && comp.code.props.length > 0 && (
              <span className="text-[9px] text-[var(--text-muted)] opacity-70">
                {comp.code.props.slice(0, 5).join(", ")}
                {comp.code.props.length > 5 ? "..." : ""}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center">
            {comp.code && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyImport(comp.name, comp.code!.importPath);
                }}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title={`Copy: import { ${comp.name} } from '${comp.code.importPath}'`}
              >
                {copiedPath === `${comp.name}::${comp.code.importPath}` ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-[var(--text-muted)]" />
                )}
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-4 px-2 pt-2 border-t border-[var(--studio-border)] mt-2">
        <span className="text-[10px] text-[var(--text-muted)]">
          {merged.filter((c) => c.design && c.code).length} matched
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">
          {merged.filter((c) => c.design && !c.code).length} design only
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">
          {merged.filter((c) => !c.design && c.code).length} code only
        </span>
      </div>
    </div>
  );
}
