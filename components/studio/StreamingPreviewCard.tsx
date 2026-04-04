"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { jsxToHtml } from "@/lib/explore/jsx-to-html";

interface StreamingPreviewCardProps {
  /** Raw JSX code streaming in from Claude */
  codeInProgress: string;
  /** Whether this variant's code block has closed */
  isComplete: boolean;
}

/**
 * Srcdoc for the preview iframe. Loads Tailwind CDN and listens for HTML updates
 * via postMessage. Posts a "tailwind-ready" message once Tailwind has loaded so
 * the parent can start sending HTML updates with confidence that styles will apply.
 *
 * The iframe is sandboxed (allow-scripts only, no allow-same-origin) so it cannot
 * access the parent page. Content comes from our own Claude API output converted
 * through jsxToHtml.
 */
const PREVIEW_SRCDOC = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.tailwindcss.com" onload="window._twReady=true;window.parent.postMessage({type:'tailwind-ready'},'*')"></${"script"}>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  #root > * {
    animation: fadeSlideIn 0.35s ease-out both;
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
</head><body>
<div id="root"></div>
<${"script"}>
  var root = document.getElementById("root");
  var lastChildCount = 0;
  var pendingHtml = null;

  function applyHtml(html) {
    if (!html) return;
    root.innerHTML = html;
    var children = root.children;
    for (var i = lastChildCount; i < children.length; i++) {
      children[i].style.animation = "none";
      children[i].offsetHeight;
      children[i].style.animation = "";
    }
    lastChildCount = children.length;
  }

  window.addEventListener("message", function(e) {
    if (!e.data) return;
    if (e.data.type === "streaming-html-update") {
      if (window._twReady) {
        applyHtml(e.data.html);
      } else {
        pendingHtml = e.data.html;
      }
    }
  });

  // Fallback: if Tailwind loads after messages arrived, apply pending
  var checkTw = setInterval(function() {
    if (window._twReady && pendingHtml) {
      applyHtml(pendingHtml);
      pendingHtml = null;
      clearInterval(checkTw);
    }
  }, 100);
  // Safety: stop checking after 5s
  setTimeout(function() { clearInterval(checkTw); }, 5000);
</${"script"}>
</body></html>`;

function StreamingPreviewCardInner({ codeInProgress, isComplete }: StreamingPreviewCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastHtmlRef = useRef("");
  const rafRef = useRef<number>(0);
  const [iframeReady, setIframeReady] = useState(false);
  const pendingHtmlRef = useRef<string>("");

  // Listen for tailwind-ready message from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "tailwind-ready") {
        setIframeReady(true);
        // Flush any pending HTML
        if (pendingHtmlRef.current) {
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              { type: "streaming-html-update", html: pendingHtmlRef.current },
              "*"
            );
          }
          pendingHtmlRef.current = "";
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const sendHtmlUpdate = useCallback((html: string) => {
    if (!html || html === lastHtmlRef.current) return;
    lastHtmlRef.current = html;

    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    if (!iframeReady) {
      // Queue for when Tailwind is ready
      pendingHtmlRef.current = html;
      return;
    }

    iframe.contentWindow.postMessage({ type: "streaming-html-update", html }, "*");
  }, [iframeReady]);

  useEffect(() => {
    if (!codeInProgress) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const html = jsxToHtml(codeInProgress);
      sendHtmlUpdate(html);
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [codeInProgress, sendHtmlUpdate]);

  const hasCode = codeInProgress.length > 0;

  return (
    <div className="group relative flex flex-col rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)]">
      {/* Pulsing accent line at top */}
      {!isComplete && (
        <div className="absolute left-0 right-0 top-0 z-10 h-[2px] overflow-hidden rounded-t-xl">
          <div className="h-full w-full animate-pulse bg-[var(--studio-accent)]/40" />
        </div>
      )}

      {/* Preview area */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white">
        {hasCode ? (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <iframe
              ref={iframeRef}
              srcDoc={PREVIEW_SRCDOC}
              sandbox="allow-scripts"
              className="w-full origin-top-left scale-50 border-0"
              style={{ width: "200%", height: "200%", pointerEvents: "none" }}
              title="Streaming preview"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] animate-pulse" style={{ animationDelay: "0ms" }} />
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] animate-pulse" style={{ animationDelay: "150ms" }} />
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

export const StreamingPreviewCard = memo(StreamingPreviewCardInner);
