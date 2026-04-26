"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

interface Props {
  /** Kit name, used as the share title. */
  name: string;
  /** Kit description, used as the share text body. */
  description?: string;
}

// Web Share API where available, copy-to-clipboard fallback. Sits alongside
// the upvote + licence chips on a kit detail page so designers can pass a
// kit around without typing the URL.
export function ShareButton({ name, description }: Props) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = name + " · Layout";
    const text = description ?? "Check out this kit on Layout";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User dismissed the share sheet, or share failed. Fall through to
        // clipboard copy so the click still does something useful.
      }
    }

    const ok = await copyToClipboard(url);
    if (ok) {
      setState("copied");
      setTimeout(() => setState("idle"), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] text-[12px] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)] hover:border-[var(--mkt-text-secondary)] transition-colors"
      aria-label={state === "copied" ? "Link copied" : "Share kit"}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {state === "copied" ? "Copied" : "Share"}
    </button>
  );
}
