import { create } from "zustand";
import { upsertProject, removeProject } from "@/lib/supabase/db";
import type { Project, ExtractionResult, TestResult, ExplorationSession } from "@/lib/types";

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  userId: string | null;
  orgId: string | null;
  hydrationError: string | null;

  // Computed
  currentProject: () => Project | undefined;

  // Actions
  loadProjects: (projects: Project[], userId: string, orgId: string) => void;
  setHydrationError: (error: string | null) => void;
  createProject: (project: Project) => void;
  setCurrentProject: (id: string) => void;
  updateDesignMd: (id: string, designMd: string) => void;
  updateExtractionData: (id: string, data: ExtractionResult) => void;
  updateProjectName: (id: string, name: string) => void;
  updateTokenCount: (id: string, count: number) => void;
  updateHealthScore: (id: string, score: number) => void;
  updateTestResults: (id: string, results: TestResult[]) => void;
  updateExplorations: (id: string, explorations: ExplorationSession[]) => void;
  deleteProject: (id: string) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProjectId: null,
  userId: null,
  orgId: null,
  hydrationError: null,

  currentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId);
  },

  loadProjects: (projects, userId, orgId) => set({ projects, userId, orgId, hydrationError: null }),

  setHydrationError: (error) => set({ hydrationError: error }),

  createProject: (project) => {
    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
    }));
    const { userId } = get();
    if (userId) void upsertProject(project, userId);
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
    const { projects, userId } = get();
    const project = projects.find((p) => p.id === id);
    if (project && userId) void upsertProject(project, userId);
  },

  updateExtractionData: (id, data) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, extractionData: data, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const { projects, userId } = get();
    const project = projects.find((p) => p.id === id);
    if (project && userId) void upsertProject(project, userId);
  },

  updateProjectName: (id, name) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, name, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const { projects, userId } = get();
    const project = projects.find((p) => p.id === id);
    if (project && userId) void upsertProject(project, userId);
  },

  updateTokenCount: (id, count) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, tokenCount: count } : p
      ),
    }));
    const { projects, userId } = get();
    const project = projects.find((p) => p.id === id);
    if (project && userId) void upsertProject(project, userId);
  },

  updateHealthScore: (id, score) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, healthScore: score } : p
      ),
    }));
    const { projects, userId } = get();
    const project = projects.find((p) => p.id === id);
    if (project && userId) void upsertProject(project, userId);
  },

  updateTestResults: (id, results) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, testResults: results } : p
      ),
    }));
    const { projects, userId } = get();
    const project = projects.find((p) => p.id === id);
    if (project && userId) void upsertProject(project, userId);
  },

  updateExplorations: (id, explorations) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, explorations, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const { projects, userId } = get();
    const project = projects.find((p) => p.id === id);
    if (project && userId) void upsertProject(project, userId);
  },

  deleteProject: (id) => {
    const { orgId } = get();
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId:
        state.currentProjectId === id ? null : state.currentProjectId,
    }));
    if (orgId) void removeProject(id, orgId);
  },

  clearProjects: () => set({ projects: [], currentProjectId: null, userId: null, orgId: null }),
}));
