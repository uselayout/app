"use client";

import { useMemo } from "react";
import { buildSrcdoc } from "@/lib/explore/preview-helpers";

interface Props {
  /** Pre-transpiled showcase JS (produced server-side by getKitShowcaseJs). */
  showcaseJs: string;
  /** The kit's tokens.css. Injected verbatim as a <style> block inside the iframe. */
  tokensCss: string;
  height?: number;
}

// Iframe host for the Kit Showcase. The showcase JS is pre-compiled on the
// server (see kit-showcase-compiled.ts) so anonymous gallery visitors render
// the preview without hitting /api/transpile, which requires auth.
export function KitShowcaseFrame({ showcaseJs, tokensCss, height = 900 }: Props) {
  const srcdoc = useMemo(
    () =>
      buildSrcdoc(showcaseJs, "App", {
        cssTokenBlock: tokensCss,
      }),
    [showcaseJs, tokensCss],
  );

  return (
    <iframe
      srcDoc={srcdoc}
      title="Kit showcase"
      sandbox="allow-scripts allow-same-origin"
      className="w-full rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)]"
      style={{ height }}
    />
  );
}
