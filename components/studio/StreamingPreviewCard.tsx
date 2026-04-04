"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { jsxToHtml } from "@/lib/explore/jsx-to-html";

interface StreamingPreviewCardProps {
  codeInProgress: string;
  isComplete: boolean;
}

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
    window.parent.postMessage({type:'content-rendered'},'*');
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

  var checkTw = setInterval(function() {
    if (window._twReady && pendingHtml) {
      applyHtml(pendingHtml);
      pendingHtml = null;
      clearInterval(checkTw);
    }
  }, 100);
  setTimeout(function() { clearInterval(checkTw); }, 5000);
</${"script"}>
</body></html>`;

/** Shimmer skeleton overlay shown before any content renders */
function ShimmerSkeleton() {
  return (
    <div className="absolute inset-0 z-20 bg-white p-6">
      <div className="flex h-full flex-col gap-3">
        {/* Hero area */}
        <div className="h-[35%] w-full animate-shimmer rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" />
        {/* Title bar */}
        <div className="h-4 w-[60%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "100ms" }} />
        {/* Subtitle */}
        <div className="h-3 w-[40%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "200ms" }} />
        {/* Body lines */}
        <div className="mt-2 h-3 w-[90%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "300ms" }} />
        <div className="h-3 w-[75%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "400ms" }} />
        {/* Button area */}
        <div className="mt-auto flex gap-2">
          <div className="h-8 w-20 animate-shimmer rounded-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "500ms" }} />
          <div className="h-8 w-20 animate-shimmer rounded-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "600ms" }} />
        </div>
      </div>
    </div>
  );
}

function StreamingPreviewCardInner({ codeInProgress, isComplete }: StreamingPreviewCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastHtmlRef = useRef("");
  const rafRef = useRef<number>(0);
  const [iframeReady, setIframeReady] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const pendingHtmlRef = useRef<string>("");

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "tailwind-ready") {
        setIframeReady(true);
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
      if (e.data?.type === "content-rendered") {
        setHasContent(true);
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

  return (
    <div
      className={`group relative flex flex-col rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] transition-opacity duration-500 ${
        isComplete ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Pulsing accent line at top */}
      {!isComplete && (
        <div className="absolute left-0 right-0 top-0 z-30 h-[2px] overflow-hidden rounded-t-xl">
          <div className="h-full w-full animate-pulse bg-[var(--studio-accent)]/40" />
        </div>
      )}

      {/* Preview area */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white">
        {/* Always mount iframe to pre-load Tailwind */}
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

        {/* Shimmer skeleton overlay — fades out when first content renders */}
        <div className={`transition-opacity duration-500 ${hasContent ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <ShimmerSkeleton />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

export const StreamingPreviewCard = memo(StreamingPreviewCardInner);
