import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project, ExtractionResult } from "@/lib/types";

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;

  // Computed
  currentProject: () => Project | undefined;

  // Actions
  createProject: (project: Project) => void;
  setCurrentProject: (id: string) => void;
  updateDesignMd: (id: string, designMd: string) => void;
  updateExtractionData: (id: string, data: ExtractionResult) => void;
  updateProjectName: (id: string, name: string) => void;
  updateTokenCount: (id: string, count: number) => void;
  updateHealthScore: (id: string, score: number) => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      currentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId);
      },

      createProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
          currentProjectId: project.id,
        })),

      setCurrentProject: (id) => set({ currentProjectId: id }),

      updateDesignMd: (id, designMd) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, designMd, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      updateExtractionData: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  extractionData: data,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      updateProjectName: (id, name) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, name, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      updateTokenCount: (id, count) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, tokenCount: count } : p
          ),
        })),

      updateHealthScore: (id, score) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, healthScore: score } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId:
            state.currentProjectId === id ? null : state.currentProjectId,
        })),
    }),
    {
      name: "superduper-projects",
    }
  )
);
