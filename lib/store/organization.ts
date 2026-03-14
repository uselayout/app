"use client";

import { create } from "zustand";
import type {
  Organization,
  OrgMember,
  OrgRole,
  Permission,
} from "@/lib/types/organization";
import { ROLE_PERMISSIONS } from "@/lib/types/organization";

interface OrganizationState {
  organizations: Organization[];
  currentOrgId: string | null;
  currentMembership: OrgMember | null;
  members: OrgMember[];

  // Computed
  currentOrg: () => Organization | undefined;
  personalOrg: () => Organization | undefined;
  hasPermission: (permission: Permission) => boolean;
  currentRole: () => OrgRole | null;

  // Actions
  loadOrganizations: (orgs: Organization[]) => void;
  setCurrentOrg: (orgId: string | null) => void;
  setCurrentMembership: (membership: OrgMember | null) => void;
  setMembers: (members: OrgMember[]) => void;
  addOrganization: (org: Organization) => void;
  updateOrganization: (
    id: string,
    updates: Partial<Pick<Organization, "name" | "slug" | "logoUrl">>
  ) => void;
  clear: () => void;
}

export const useOrganizationStore = create<OrganizationState>()((set, get) => ({
  organizations: [],
  currentOrgId: null,
  currentMembership: null,
  members: [],

  currentOrg: () => {
    const { organizations, currentOrgId } = get();
    return organizations.find((o) => o.id === currentOrgId);
  },

  personalOrg: () => {
    const { organizations } = get();
    return organizations.find((o) => o.slug.startsWith("personal-"));
  },

  hasPermission: (permission: Permission) => {
    const { currentMembership } = get();
    if (!currentMembership) return false;
    return ROLE_PERMISSIONS[currentMembership.role][permission];
  },

  currentRole: () => {
    const { currentMembership } = get();
    return currentMembership?.role ?? null;
  },

  loadOrganizations: (orgs) => set({ organizations: orgs }),

  setCurrentOrg: (orgId) => set({ currentOrgId: orgId }),

  setCurrentMembership: (membership) =>
    set({ currentMembership: membership }),

  setMembers: (members) => set({ members }),

  addOrganization: (org) =>
    set((state) => ({
      organizations: [...state.organizations, org],
    })),

  updateOrganization: (id, updates) =>
    set((state) => ({
      organizations: state.organizations.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),

  clear: () =>
    set({
      organizations: [],
      currentOrgId: null,
      currentMembership: null,
      members: [],
    }),
}));
