"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  buildSrcdoc,
  extractComponentName,
} from "@/lib/explore/preview-helpers";
import type { Component } from "@/lib/types/component";

interface ComponentCardProps {
  component: Component;
  orgSlug: string;
}

const STATUS_COLOURS: Record<string, string> = {
  approved: "#22C55E",
  draft: "#F59E0B",
  deprecated: "#EF4444",
};

export function ComponentCard({ component, orgSlug }: ComponentCardProps) {
  const params = useParams();
  const projectId = (params?.projectId as string) ?? "";
  const componentName = extractComponentName(component.code);
  const srcdoc =
    component.compiledJs
      ? buildSrcdoc(component.compiledJs, componentName)
      : null;

  const libraryBase = projectId
    ? `/${orgSlug}/projects/${projectId}/library`
    : `/${orgSlug}/library`;

  return (
    <Link
      href={`${libraryBase}/${component.slug}`}
      className="block overflow-hidden rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-surface)] transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
    >
      {/* Preview area */}
      <div className="h-40 bg-[var(--bg-elevated)]">
        {srcdoc ? (
          <iframe
            srcDoc={srcdoc}
            sandbox="allow-scripts"
            className="h-full w-full border-0"
            title={component.name}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
            No preview
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {component.name}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {component.category && (
            <span className="rounded bg-[var(--studio-accent-subtle)] px-2 py-0.5 text-[var(--studio-accent)]">
              {component.category}
            </span>
          )}
          <span className="text-[var(--text-muted)]">v{component.version}</span>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: STATUS_COLOURS[component.status] ?? STATUS_COLOURS.draft }}
            title={component.status}
          />
          <span className="capitalize text-[var(--text-muted)]">
            {component.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
