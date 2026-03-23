import { create } from "zustand";
import { parseTokensFromLayoutMd } from "@/lib/tokens/parse-layout-md";
import type { Project, ExtractionResult, ExtractedToken, ExtractedTokens, ExplorationSession, SourceType } from "@/lib/types";

/** Save a project via the server-side API (bypasses RLS). */
function apiUpsertProject(project: Project, onError?: (msg: string) => void): void {
  void (async () => {
    try {
      const res = await fetch(`/api/organizations/${project.orgId}/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        const msg = `Save failed (${res.status})${detail ? `: ${detail}` : ""}`;
        console.error("Failed to save project:", msg);
        onError?.(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      console.error("Failed to save project:", msg);
      onError?.(msg);
    }
  })();
}

/** Delete a project via the server-side API. */
function apiDeleteProject(id: string, orgId: string): void {
  void fetch(`/api/organizations/${orgId}/projects/${id}`, {
    method: "DELETE",
  }).catch((err) => console.error("Failed to delete project:", err));
}

/** Fetch a single project via the server-side API. */
async function apiFetchProject(id: string, orgId: string): Promise<Project | null> {
  const res = await fetch(`/api/organizations/${orgId}/projects/${id}`);
  if (!res.ok) return null;
  return res.json() as Promise<Project>;
}

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
  saveError: string | null;

  // Computed
  currentProject: () => Project | undefined;

  // Actions
  setHydrating: (v: boolean) => void;
  clearSaveError: () => void;
  loadProjects: (projects: Project[], userId: string, orgId: string) => void;
  setHydrationError: (error: string | null) => void;
  createProject: (project: Project) => void;
  setCurrentProject: (id: string) => void;
  updateLayoutMd: (id: string, layoutMd: string) => void;
  updateExtractionData: (id: string, data: ExtractionResult) => void;
  updateProjectName: (id: string, name: string) => void;
  updateProjectSource: (id: string, sourceUrl: string, sourceType: SourceType) => void;
  updateTokenCount: (id: string, count: number) => void;
  updateHealthScore: (id: string, score: number) => void;
  updateExplorations: (id: string, explorations: ExplorationSession[]) => void;
  removeTokens: (id: string, tokenType: keyof ExtractedTokens, tokenNames: string[]) => void;
  syncTokensFromLayoutMd: (id: string) => number;
  refreshProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProjectId: null,
  userId: null,
  orgId: null,
  hydrating: true,
  hydrationError: null,
  saveError: null,

  currentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId);
  },

  setHydrating: (v) => set({ hydrating: v }),
  clearSaveError: () => set({ saveError: null }),

  loadProjects: (projects, userId, orgId) => set({ projects, userId, orgId, hydrating: false, hydrationError: null }),

  setHydrationError: (error) => set({ hydrationError: error }),

  createProject: (project) => {
    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
    }));
    apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  updateLayoutMd: (id, layoutMd) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, layoutMd, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  updateExtractionData: (id, data) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, extractionData: data, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
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
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  updateProjectSource: (id, sourceUrl, sourceType) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, sourceUrl, sourceType, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  updateTokenCount: (id, count) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, tokenCount: count } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  updateHealthScore: (id, score) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, healthScore: score } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  updateExplorations: (id, explorations) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, explorations, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
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
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  syncTokensFromLayoutMd: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project?.layoutMd) return 0;

    const parsed = parseTokensFromLayoutMd(project.layoutMd);
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
          sourceName: "layout.md",
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

    const updated = get().projects.find((p) => p.id === id);
    if (updated) apiUpsertProject(updated, (msg) => set({ saveError: msg }));

    return totalParsed;
  },

  refreshProject: async (id) => {
    const { orgId } = get();
    if (!orgId) return;
    const fresh = await apiFetchProject(id, orgId);
    if (!fresh) return;
    set((state) => {
      const exists = state.projects.some((p) => p.id === id);
      return {
        projects: exists
          ? state.projects.map((p) => (p.id === id ? fresh : p))
          : [...state.projects, fresh],
      };
    });
  },

  deleteProject: (id) => {
    const { orgId } = get();
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId:
        state.currentProjectId === id ? null : state.currentProjectId,
    }));
    if (orgId) apiDeleteProject(id, orgId);
  },

  clearProjects: () => set({ projects: [], currentProjectId: null, userId: null, orgId: null, hydrating: false, saveError: null }),
}));
