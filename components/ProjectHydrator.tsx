"use client";

import { useEffect } from "react";
import { fetchAllProjects } from "@/lib/supabase/db";
import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import { useSession } from "@/lib/auth-client";

export function ProjectHydrator() {
  const { data: session } = useSession();
  const currentOrgId = useOrgStore((s) => s.currentOrgId);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const clearProjects = useProjectStore((s) => s.clearProjects);
  const setHydrationError = useProjectStore((s) => s.setHydrationError);
  const hydrationError = useProjectStore((s) => s.hydrationError);

  useEffect(() => {
    if (!session?.user?.id || !currentOrgId) {
      clearProjects();
      return;
    }

    const userId = session.user.id;
    fetchAllProjects(currentOrgId)
      .then((projects) => loadProjects(projects, userId, currentOrgId))
      .catch((err: unknown) => {
        console.error("Failed to hydrate projects from Supabase:", err);
        setHydrationError("Failed to load projects. Please refresh the page.");
      });
  }, [session?.user?.id, currentOrgId, loadProjects, clearProjects, setHydrationError]);

  if (!hydrationError) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-[var(--status-error)]/30 bg-[var(--bg-elevated)] px-4 py-2 text-xs text-[var(--status-error)] shadow-lg">
      {hydrationError}
    </div>
  );
}
