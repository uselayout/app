"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildSrcdoc,
  extractComponentName,
  sanitizeRelativeSrc,
  buildCssTokenBlock,
} from "@/lib/explore/preview-helpers";
import { buildVariantInvocation, detectExportName } from "@/lib/component-edits/apply";
import { useProjectStore } from "@/lib/store/project";
import { Loader2 } from "lucide-react";

interface Props {
  /** Project id used to look up token CSS for the iframe. */
  projectId: string;
  /** Current TSX (post-edits). */
  code: string;
  /** Variant prop values to pass when rendering the component. */
  variantValues: Record<string, string>;
  /** Optional: viewport width override. */
  width?: number;
  /** Optional: container className. */
  className?: string;
}

/**
 * Inspector live preview iframe. Re-uses the same transpile + srcdoc pipeline
 * the Explorer uses (preview-helpers.ts) so behaviour stays consistent with
 * VariantCard and ResponsivePreview. Re-renders on every code or variant
 * value change with a 200ms debounce so rapid form edits don't thrash the
 * transpile endpoint.
 */
export function ComponentPreview({ projectId, code, variantValues, width, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const extractionData = useProjectStore(
    (s) => s.projects.find((p) => p.id === projectId)?.extractionData
  );
  const cssTokenBlock = buildCssTokenBlock(
    extractionData?.cssVariables,
    extractionData?.tokens
  );

  useEffect(() => {
    let cancelled = false;
    setPending(true);

    const handle = window.setTimeout(async () => {
      try {
        const exportName = detectExportName(code);
        const wrapper = Object.keys(variantValues).length > 0
          ? buildVariantInvocation(exportName, variantValues)
          : "";
        const fullCode = sanitizeRelativeSrc(`${code}\n\n${wrapper}`);

        const res = await fetch("/api/transpile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: fullCode }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? `Transpile failed (${res.status})`);
        }
        const { js } = await res.json();
        if (cancelled) return;

        // Render the wrapper if present, otherwise fall back to the
        // component's own export name.
        const renderName =
          Object.keys(variantValues).length > 0 ? "__PreviewWrapper" : extractComponentName(code);
        const srcdoc = buildSrcdoc(js, renderName, { cssTokenBlock });
        if (iframeRef.current) {
          iframeRef.current.srcdoc = srcdoc;
        }
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Preview failed");
      } finally {
        if (!cancelled) setPending(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [code, variantValues, cssTokenBlock]);

  return (
    <div className={`relative overflow-hidden rounded-lg border border-[var(--studio-border)] bg-white ${className ?? ""}`}>
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className="h-full w-full border-0"
        style={{ width, minHeight: 220 }}
        title="Component preview"
      />
      {pending ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/5">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-x-0 bottom-0 border-t border-[var(--studio-border)] bg-[var(--bg-panel)] px-3 py-2 text-[10px] text-[var(--color-error,#b3261e)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
