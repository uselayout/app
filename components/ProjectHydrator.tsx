"use client";

import { useProjectStore } from "@/lib/store/project";

/**
 * Displays hydration errors. Project fetching is now handled by OrgProvider
 * (fires in parallel with membership/members instead of waiting for currentOrgId).
 */
export function ProjectHydrator() {
  const hydrationError = useProjectStore((s) => s.hydrationError);

  if (!hydrationError) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-[var(--status-error)]/30 bg-[var(--bg-elevated)] px-4 py-2 text-xs text-[var(--status-error)] shadow-lg">
      {hydrationError}
    </div>
  );
}
