import { create } from "zustand";
import { upsertProject, removeProject } from "@/lib/supabase/db";
import { parseTokensFromDesignMd } from "@/lib/tokens/parse-design-md";
import type { Project, ExtractionResult, ExtractedToken, ExtractedTokens, TestResult, ExplorationSession } from "@/lib/types";

/** Merge two token arrays, deduplicating by name (new values overwrite existing). */
function mergeTokens(existing: ExtractedToken[] | undefined, parsed: ExtractedToken[]): ExtractedToken[] {
  const map = new Map<string, ExtractedToken>();
  for (const t of existing ?? []) map.set(t.name, t);
  for (const t of parsed) map.set(t.name, t);
  return [...map.values()];
}

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  userId: string | null;
  orgId: string | null;
  hydrating: boolean;
  hydrationError: string | null;

  // Computed
  currentProject: () => Project | undefined;

  // Actions
  setHydrating: (v: boolean) => void;
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
  removeTokens: (id: string, tokenType: keyof ExtractedTokens, tokenNames: string[]) => void;
  syncTokensFromDesignMd: (id: string) => number;
  deleteProject: (id: string) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProjectId: null,
  userId: null,
  orgId: null,
  hydrating: false,
  hydrationError: null,

  currentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId);
  },

  setHydrating: (v) => set({ hydrating: v }),

  loadProjects: (projects, userId, orgId) => set({ projects, userId, orgId, hydrating: false, hydrationError: null }),

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

  removeTokens: (id, tokenType, tokenNames) => {
    const nameSet = new Set(tokenNames);
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id || !p.extractionData) return p;
        const tokens = { ...p.extractionData.tokens };
        tokens[tokenType] = tokens[tokenType].filter((t) => !nameSet.has(t.name));
        const tokenCount =
          tokens.colors.length +
          tokens.typography.length +
          tokens.spacing.length +
          tokens.radius.length +
          tokens.effects.length;
        return {
          ...p,
          extractionData: { ...p.extractionData, tokens },
          tokenCount,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    const { projects, userId } = get();
    const project = projects.find((p) => p.id === id);
    if (project && userId) void upsertProject(project, userId);
  },

  syncTokensFromDesignMd: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project?.designMd) return 0;

    const parsed = parseTokensFromDesignMd(project.designMd);
    const totalParsed =
      parsed.colors.length +
      parsed.typography.length +
      parsed.spacing.length +
      parsed.radius.length +
      parsed.effects.length;

    if (totalParsed === 0) return 0;

    // Merge with existing extraction data, parsed tokens added after existing
    const existing = project.extractionData;
    const mergedTokens: ExtractedTokens = {
      colors: mergeTokens(existing?.tokens.colors, parsed.colors),
      typography: mergeTokens(existing?.tokens.typography, parsed.typography),
      spacing: mergeTokens(existing?.tokens.spacing, parsed.spacing),
      radius: mergeTokens(existing?.tokens.radius, parsed.radius),
      effects: mergeTokens(existing?.tokens.effects, parsed.effects),
    };

    const mergedData: ExtractionResult = existing
      ? { ...existing, tokens: mergedTokens }
      : {
          sourceType: "manual",
          sourceName: "DESIGN.md",
          tokens: mergedTokens,
          components: [],
          screenshots: [],
          fonts: [],
          animations: [],
          librariesDetected: {},
          cssVariables: {},
          computedStyles: {},
        };

    const newCount =
      mergedTokens.colors.length +
      mergedTokens.typography.length +
      mergedTokens.spacing.length +
      mergedTokens.radius.length +
      mergedTokens.effects.length;

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              extractionData: mergedData,
              tokenCount: newCount,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));

    const { projects, userId } = get();
    const updated = projects.find((p) => p.id === id);
    if (updated && userId) void upsertProject(updated, userId);

    return totalParsed;
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
