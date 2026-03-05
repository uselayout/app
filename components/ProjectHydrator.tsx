"use client";

import { useEffect } from "react";
import { fetchAllProjects } from "@/lib/supabase/db";
import { useProjectStore } from "@/lib/store/project";

export function ProjectHydrator() {
  const loadProjects = useProjectStore((s) => s.loadProjects);

  useEffect(() => {
    fetchAllProjects().then(loadProjects).catch((err: unknown) => {
      console.error("Failed to hydrate projects from Supabase:", err);
    });
  }, [loadProjects]);

  return null;
}
