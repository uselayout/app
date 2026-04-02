"use client";

import { useState } from "react";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";

interface FigmaEmbedProps {
  fileKey: string;
  nodeId?: string;
  title?: string;
  height?: number;
  className?: string;
}

/**
 * Embeds a live, updating Figma file using Figma's Embed Kit.
 * Shows the design in an iframe that reflects real-time changes.
 */
export function FigmaEmbed({
  fileKey,
  nodeId,
  title,
  height = 400,
  className = "",
}: FigmaEmbedProps) {
  const [expanded, setExpanded] = useState(false);

  const params = new URLSearchParams({
    "embed-host": "layout",
    theme: "dark",
    "hot-spot-hints": "0",
    "hide-ui": "1",
  });
  if (nodeId) {
    params.set("node-id", nodeId);
  }

  const embedUrl = `https://embed.figma.com/design/${fileKey}?${params.toString()}`;
  const figmaUrl = `https://www.figma.com/design/${fileKey}${nodeId ? `?node-id=${nodeId.replaceAll(":", "-")}` : ""}`;

  return (
    <div className={`rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <svg width={12} height={18} viewBox="0 0 26 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 38.5C10.09 38.5 13 35.59 13 32V25.5H6.5C2.91 25.5 0 28.41 0 32C0 35.59 2.91 38.5 6.5 38.5Z" fill="#0ACF83"/>
            <path d="M0 19.5C0 15.91 2.91 13 6.5 13H13V26H6.5C2.91 26 0 23.09 0 19.5Z" fill="#A259FF"/>
            <path d="M0 6.5C0 2.91 2.91 0 6.5 0H13V13H6.5C2.91 13 0 10.09 0 6.5Z" fill="#F24E1E"/>
            <path d="M13 0H19.5C23.09 0 26 2.91 26 6.5C26 10.09 23.09 13 19.5 13H13V0Z" fill="#FF7262"/>
            <path d="M26 19.5C26 23.09 23.09 26 19.5 26C15.91 26 13 23.09 13 19.5C13 15.91 15.91 13 19.5 13C23.09 13 26 15.91 26 19.5Z" fill="#1ABCFE"/>
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {title ?? "Figma Preview"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <a
            href={figmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            title="Open in Figma"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Embed */}
      <iframe
        src={embedUrl}
        className="w-full border-0"
        style={{ height: expanded ? 600 : height }}
        allowFullScreen
      />
    </div>
  );
}
