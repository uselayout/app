"use client";

import { useState, useEffect } from "react";
import type { ComponentVersion } from "@/lib/types/component";

interface ComponentVersionHistoryProps {
  componentId: string;
  orgId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ComponentVersionHistory({
  componentId,
  orgId,
}: ComponentVersionHistoryProps) {
  const [versions, setVersions] = useState<ComponentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchVersions() {
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/components/${componentId}/versions`
        );
        if (!res.ok) return;
        const data: ComponentVersion[] = await res.json();
        if (!cancelled) setVersions(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVersions();
    return () => {
      cancelled = true;
    };
  }, [componentId, orgId]);

  if (loading) {
    return (
      <p className="py-4 text-sm text-[var(--text-muted)]">
        Loading versions...
      </p>
    );
  }

  if (versions.length === 0) {
    return (
      <p className="py-4 text-sm text-[var(--text-muted)]">
        No version history yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--studio-border)]">
      {versions.map((v) => (
        <li key={v.id} className="py-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[var(--text-primary)]">
              v{v.version}
            </span>
            <span className="text-[var(--text-muted)]">
              {formatDate(v.createdAt)}
            </span>
          </div>
          {v.changeSummary && (
            <p className="mt-1 text-[var(--text-secondary)]">
              {v.changeSummary}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
