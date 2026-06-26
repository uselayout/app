"use client";

import { useMemo } from "react";
import { buildSrcdoc } from "@/lib/explore/preview-helpers";

interface Props {
  /** Pre-transpiled showcase JS (produced server-side by getKitShowcaseJs). */
  showcaseJs: string;
  /** The kit's tokens.css. Injected verbatim as a <style> block inside the iframe. */
  tokensCss: string;
  /** Kit metadata for the uniform Hero (logo + name + description) and
   * per-kit component styling via styleProfile.
   * Bespoke showcases ignore this and embed their own. */
  kit?: { name?: string; description?: string; logoUrl?: string; styleProfile?: unknown };
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

  // The showcase carries its own sticky in-frame nav, so it needs a bounded
  // height with internal scroll (sticky tracks the iframe's own scroll, not
  // the parent page). Tall by default so the reference feels full-bleed.
  //
  // On touch/mobile a near-full-viewport iframe traps the scroll gesture: the
  // finger drives the iframe's internal scroll and the parent page can never
  // reach the "You may also like" section below. So when filling the viewport
  // we cap the height to ~62vh on small screens, leaving page chrome above and
  // below the frame that the user can grab to scroll past it. Desktop keeps the
  // tall full-bleed frame via the `sm:` breakpoint.
  if (fillViewport) {
    return (
      <iframe
        srcDoc={srcdoc}
        title="Kit showcase"
        sandbox="allow-scripts allow-same-origin"
        className="w-full rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] h-[62vh] min-h-[420px] sm:h-[calc(100vh-130px)] sm:min-h-[760px]"
      />
    );
  }

  return (
    <iframe
      srcDoc={srcdoc}
      title="Kit showcase"
      sandbox="allow-scripts allow-same-origin"
      className="w-full rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)]"
      style={{ height: height ?? 900 }}
    />
  );
}
