"use client";

import { useEffect } from "react";
import { fetchAllProjects } from "@/lib/supabase/db";
import { useProjectStore } from "@/lib/store/project";
import { useSession } from "@/lib/auth-client";

export function ProjectHydrator() {
  const { data: session } = useSession();
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const clearProjects = useProjectStore((s) => s.clearProjects);

  useEffect(() => {
    if (!session?.user?.id) {
      clearProjects();
      return;
    }

    const userId = session.user.id;
    fetchAllProjects(userId)
      .then((projects) => loadProjects(projects, userId))
      .catch((err: unknown) => {
        console.error("Failed to hydrate projects from Supabase:", err);
      });
  }, [session?.user?.id, loadProjects, clearProjects]);

  return null;
}
