import { create } from "zustand";
import { parseTokensFromLayoutMd } from "@/lib/tokens/parse-layout-md";
import { replaceTokenInLayoutMd } from "@/lib/tokens/replace-token";
import { renameTokenInLayoutMd } from "@/lib/tokens/rename-token";
import type { Project, ExtractionResult, ExtractedToken, ExtractedTokens, ExplorationSession, SourceType, UploadedFont, ProjectStandardisation, DesignSystemSnapshot } from "@/lib/types";

/**
 * Strip large base64 data from the project before sending to the API.
 * referenceImage and compiledJs bloat the payload (often >10MB) and cause
 * JSON parsing failures due to body size limits.
 */
function stripBloatForSave(project: Project): Project {
  const stripped = { ...project };

  // Strip referenceImage (base64 screenshots) from exploration sessions
  if (stripped.explorations) {
    stripped.explorations = stripped.explorations.map((session) => {
      const s = { ...session };
      // Remove base64 reference images - they're only needed client-side
      if (s.referenceImage && s.referenceImage.length > 1000) {
        delete s.referenceImage;
      }
      // Remove transient generation tracking fields
      delete s.generatingBatchId;
      delete s.generatingBatchExpected;
      // Strip compiledJs and large data URIs from variants
      if (s.variants) {
        s.variants = s.variants.map((v) => {
          const { compiledJs, ...rest } = v;
          // Strip large base64 data URIs from variant HTML (images regenerated client-side)
          if (rest.code) {
            rest.code = rest.code.replace(
              /src\s*=\s*"data:image\/[^"]{500,}"/gi,
              'src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27/%3E"'
            );
          }
          return rest;
        });
      }
      // Strip compiledJs from comparisons too
      if (s.comparisons) {
        s.comparisons = s.comparisons.map((c) => ({
          ...c,
          withDs: { ...c.withDs, compiledJs: undefined },
          withoutDs: { ...c.withoutDs, compiledJs: undefined },
        }));
      }
      // Strip large context file content (only needed during generation)
      if (s.contextFiles) {
        s.contextFiles = s.contextFiles.map((cf) => {
          const stripped = { ...cf };
          if (typeof stripped.content === "string" && stripped.content.length > 1000) {
            stripped.content = "[stripped]";
          }
          return stripped;
        });
      }
      return s;
    });
  }

  return stripped;
}

/** Save a project via the server-side API (bypasses RLS). */
function apiUpsertProject(project: Project, onError?: (msg: string) => void): void {
  if (!project.orgId) {
    const msg = "Cannot save project: missing orgId";
    console.error(msg);
    onError?.(msg);
    return;
  }
  void (async () => {
    try {
      const body = JSON.stringify(stripBloatForSave(project));
      if (body.length > 5_000_000) {
        console.warn(`[save] Payload is ${(body.length / 1_000_000).toFixed(1)}MB — may exceed proxy limits`);
      }
      const res = await fetch(`/api/organizations/${project.orgId}/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
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

/** Save a project via the server-side API (awaitable version). */
async function apiUpsertProjectAsync(project: Project): Promise<string | null> {
  if (!project.orgId) return "Cannot save project: missing orgId";
  try {
    const body = JSON.stringify(stripBloatForSave(project));
    if (body.length > 5_000_000) {
      console.warn(`[save] Payload is ${(body.length / 1_000_000).toFixed(1)}MB — may exceed proxy limits`);
    }
    const res = await fetch(`/api/organizations/${project.orgId}/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return `Save failed (${res.status})${detail ? `: ${detail}` : ""}`;
    }
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Network error";
  }
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

/** Create a unique key for a token, accounting for mode variants. */
function modeAwareTokenKey(t: ExtractedToken): string {
  return t.mode ? `${t.name}::${t.mode}` : t.name;
}

/** Merge two token arrays, deduplicating by name+mode (new values overwrite existing). */
function mergeTokens(existing: ExtractedToken[] | undefined, parsed: ExtractedToken[]): ExtractedToken[] {
  const map = new Map<string, ExtractedToken>();
  for (const t of existing ?? []) map.set(modeAwareTokenKey(t), t);
  for (const t of parsed) map.set(modeAwareTokenKey(t), t);
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
  createProjectAsync: (project: Project) => Promise<string | null>;
  setCurrentProject: (id: string) => void;
  updateLayoutMd: (id: string, layoutMd: string) => void;
  updateExtractionData: (id: string, data: ExtractionResult) => void;
  updateProjectName: (id: string, name: string) => void;
  updateProjectSource: (id: string, sourceUrl: string, sourceType: SourceType) => void;
  updateTokenCount: (id: string, count: number) => void;
  updateHealthScore: (id: string, score: number) => void;
  updateIconPacks: (id: string, iconPacks: string[]) => void;
  updateUploadedFonts: (id: string, fonts: UploadedFont[]) => void;
  updateExplorations: (id: string, explorations: ExplorationSession[]) => void;
  updateToken: (id: string, tokenType: keyof ExtractedTokens, tokenName: string, newValue: string, mode?: string) => void;
  renameToken: (id: string, tokenType: keyof ExtractedTokens, oldName: string, newName: string, mode?: string) => void;
  removeTokens: (id: string, tokenType: keyof ExtractedTokens, tokenNames: string[], mode?: string) => void;
  syncTokensFromLayoutMd: (id: string) => number;
  refreshProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => void;
  clearProjects: () => void;

  // Standardisation
  updateStandardisation: (id: string, data: ProjectStandardisation) => void;

  // Snapshots
  createSnapshot: (id: string, label: string) => string | null;
  restoreSnapshot: (id: string, snapshotId: string) => boolean;
  deleteSnapshot: (id: string, snapshotId: string) => void;
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

  loadProjects: (serverProjects, userId, orgId) => set((state) => {
    // Preserve locally-created projects not yet on the server (in-flight saves)
    const serverIds = new Set(serverProjects.map((p) => p.id));
    const localOnly = state.projects.filter((p) => !serverIds.has(p.id) && p.orgId === orgId);
    return {
      projects: [...serverProjects, ...localOnly],
      userId, orgId, hydrating: false, hydrationError: null,
    };
  }),

  setHydrationError: (error) => set({ hydrationError: error }),

  createProject: (project) => {
    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
    }));
    apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  createProjectAsync: async (project) => {
    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
    }));
    const error = await apiUpsertProjectAsync(project);
    if (error) set({ saveError: error });
    return error;
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

  updateIconPacks: (id, iconPacks) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, iconPacks } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  updateUploadedFonts: (id, uploadedFonts) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, uploadedFonts } : p
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

  updateToken: (id, tokenType, tokenName, newValue, mode) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id || !p.extractionData) return p;
        const tokens = { ...p.extractionData.tokens };
        tokens[tokenType] = tokens[tokenType].map((t) =>
          t.name === tokenName && t.mode === mode ? { ...t, value: newValue } : t
        );
        const updatedLayoutMd = replaceTokenInLayoutMd(p.layoutMd, tokenName, newValue) ?? p.layoutMd;
        return {
          ...p,
          extractionData: { ...p.extractionData, tokens },
          layoutMd: updatedLayoutMd,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  renameToken: (id, tokenType, oldName, newName, mode) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id || !p.extractionData) return p;

        // Update the token name + cssVariable in extraction data
        const tokens = { ...p.extractionData.tokens };
        const tokenTypeKey = tokenType as keyof ExtractedTokens;
        for (const key of Object.keys(tokens) as (keyof ExtractedTokens)[]) {
          tokens[key] = tokens[key].map((t) => {
            // Rename the token itself (match by name + mode)
            if (key === tokenTypeKey && t.name === oldName && t.mode === mode) {
              return {
                ...t,
                name: newName,
                cssVariable: t.cssVariable ? t.cssVariable.replace(oldName, newName) : undefined,
              };
            }
            // Update var() references in other tokens' values
            if (t.value.includes(oldName)) {
              return { ...t, value: t.value.replaceAll(oldName, newName) };
            }
            return t;
          });
        }

        // Rename throughout the entire layout.md
        const updatedLayoutMd = renameTokenInLayoutMd(p.layoutMd, oldName, newName) ?? p.layoutMd;

        return {
          ...p,
          extractionData: { ...p.extractionData, tokens },
          layoutMd: updatedLayoutMd,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  removeTokens: (id, tokenType, tokenNames, mode) => {
    const nameSet = new Set(tokenNames);
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id || !p.extractionData) return p;
        const tokens = { ...p.extractionData.tokens };
        tokens[tokenType] = tokens[tokenType].filter((t) => {
          const isTarget = nameSet.has(t.name) && t.mode === mode;
          return !isTarget;
        });
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
      motion: mergeTokens(existing?.tokens.motion, parsed.motion),
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
      if (!exists) return { projects: [...state.projects, fresh] };
      return {
        projects: state.projects.map((p) =>
          p.id === id
            ? {
                ...fresh,
                explorations: p.explorations ?? fresh.explorations,
                // If we already consumed the canvas image locally (set to null), don't restore from server
                pendingCanvasImage: p.pendingCanvasImage !== undefined ? p.pendingCanvasImage : fresh.pendingCanvasImage,
                // Prefer server data if it has fonts, otherwise keep local (save may be in-flight)
                uploadedFonts: fresh.uploadedFonts ?? p.uploadedFonts,
                iconPacks: p.iconPacks ?? fresh.iconPacks,
              }
            : p
        ),
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

  // ── Standardisation ─────────────────────────────────────────────────────

  updateStandardisation: (id, data) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, standardisation: data, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) apiUpsertProject(project, (msg) => set({ saveError: msg }));
  },

  // ── Snapshots ───────────────────────────────────────────────────────────

  createSnapshot: (id, label) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project?.extractionData?.tokens) return null;

    const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const allTokens = project.extractionData.tokens;
    const tokenCount = Object.values(allTokens).reduce(
      (sum, arr) => sum + (arr as ExtractedToken[]).length,
      0
    );

    const snapshot: DesignSystemSnapshot = {
      id: snapshotId,
      label,
      tokens: JSON.parse(JSON.stringify(allTokens)),
      layoutMd: project.layoutMd,
      healthScore: project.healthScore,
      tokenCount,
      standardisation: project.standardisation
        ? JSON.parse(JSON.stringify(project.standardisation))
        : undefined,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p;
        const existing = p.snapshots ?? [];
        // Keep max 5 snapshots, drop oldest if needed
        const trimmed = existing.length >= 5 ? existing.slice(1) : existing;
        return {
          ...p,
          snapshots: [...trimmed, snapshot],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));

    const updated = get().projects.find((p) => p.id === id);
    if (updated) apiUpsertProject(updated, (msg) => set({ saveError: msg }));
    return snapshotId;
  },

  restoreSnapshot: (id, snapshotId) => {
    const project = get().projects.find((p) => p.id === id);
    const snapshot = project?.snapshots?.find((s) => s.id === snapshotId);
    if (!project || !snapshot) return false;

    // Create a snapshot of current state before restoring (non-destructive)
    get().createSnapshot(id, `Before restore (${new Date().toISOString().slice(0, 16)})`);

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          layoutMd: snapshot.layoutMd,
          extractionData: p.extractionData
            ? { ...p.extractionData, tokens: JSON.parse(JSON.stringify(snapshot.tokens)) }
            : undefined,
          healthScore: snapshot.healthScore,
          standardisation: snapshot.standardisation
            ? JSON.parse(JSON.stringify(snapshot.standardisation))
            : undefined,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));

    const updated = get().projects.find((p) => p.id === id);
    if (updated) apiUpsertProject(updated, (msg) => set({ saveError: msg }));
    return true;
  },

  deleteSnapshot: (id, snapshotId) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          snapshots: (p.snapshots ?? []).filter((s) => s.id !== snapshotId),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    const updated = get().projects.find((p) => p.id === id);
    if (updated) apiUpsertProject(updated, (msg) => set({ saveError: msg }));
  },
}));
