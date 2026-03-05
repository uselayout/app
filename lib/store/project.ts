import { create } from "zustand";
import { upsertProject, removeProject } from "@/lib/supabase/db";
import type { Project, ExtractionResult } from "@/lib/types";

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;

  // Computed
  currentProject: () => Project | undefined;

  // Actions
  loadProjects: (projects: Project[]) => void;
  createProject: (project: Project) => void;
  setCurrentProject: (id: string) => void;
  updateDesignMd: (id: string, designMd: string) => void;
  updateExtractionData: (id: string, data: ExtractionResult) => void;
  updateProjectName: (id: string, name: string) => void;
  updateTokenCount: (id: string, count: number) => void;
  updateHealthScore: (id: string, score: number) => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProjectId: null,

  currentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId);
  },

  loadProjects: (projects) => set({ projects }),

  createProject: (project) => {
    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
    }));
    void upsertProject(project);
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  updateDesignMd: (id, designMd) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, designMd, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) void upsertProject(project);
  },

  updateExtractionData: (id, data) => {
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
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) void upsertProject(project);
  },

  updateProjectName: (id, name) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, name, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) void upsertProject(project);
  },

  updateTokenCount: (id, count) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, tokenCount: count } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) void upsertProject(project);
  },

  updateHealthScore: (id, score) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, healthScore: score } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) void upsertProject(project);
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId:
        state.currentProjectId === id ? null : state.currentProjectId,
    }));
    void removeProject(id);
  },
}));
