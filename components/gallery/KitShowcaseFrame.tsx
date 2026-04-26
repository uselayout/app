"use client";

import { useMemo } from "react";
import { buildSrcdoc } from "@/lib/explore/preview-helpers";

interface Props {
  /** Pre-transpiled showcase JS (produced server-side by getKitShowcaseJs). */
  showcaseJs: string;
  /** The kit's tokens.css. Injected verbatim as a <style> block inside the iframe. */
  tokensCss: string;
  /** Kit metadata for the uniform Hero (logo + name + description).
   * Bespoke showcases ignore this and embed their own. */
  kit?: { name?: string; description?: string; logoUrl?: string };
  /** Explicit pixel height. Overrides `fillViewport`. */
  height?: number;
  /** Fill the viewport (minus a top offset for the page header). */
  fillViewport?: boolean;
}

// Iframe host for the Kit Showcase. The showcase JS is pre-compiled on the
// server (see kit-showcase-compiled.ts) so anonymous gallery visitors render
// the preview without hitting /api/transpile, which requires auth.
export function KitShowcaseFrame({ showcaseJs, tokensCss, kit, height, fillViewport }: Props) {
  const srcdoc = useMemo(
    () =>
      buildSrcdoc(showcaseJs, "App", {
        cssTokenBlock: tokensCss,
        kit,
      }),
    [showcaseJs, tokensCss, kit],
  );

  const style: React.CSSProperties = fillViewport
    ? { height: "calc(100vh - 160px)", minHeight: 720 }
    : { height: height ?? 900 };

  return (
    <iframe
      srcDoc={srcdoc}
      title="Kit showcase"
      sandbox="allow-scripts allow-same-origin"
      className="w-full rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)]"
      style={style}
    />
  );
}
