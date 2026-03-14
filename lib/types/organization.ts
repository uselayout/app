export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  invitedBy: string | null;
  joinedAt: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export interface OrgInvitation {
  id: string;
  orgId: string;
  email: string;
  role: Exclude<OrgRole, "owner">;
  invitedBy: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export const ROLE_PERMISSIONS = {
  owner: {
    manageOrg: true,
    manageMembers: true,
    manageBilling: true,
    createProject: true,
    editProject: true,
    viewProject: true,
    deleteProject: true,
    reviewCandidate: true,
    manageApiKeys: true,
  },
  admin: {
    manageOrg: false,
    manageMembers: true,
    manageBilling: true,
    createProject: true,
    editProject: true,
    viewProject: true,
    deleteProject: true,
    reviewCandidate: true,
    manageApiKeys: true,
  },
  editor: {
    manageOrg: false,
    manageMembers: false,
    manageBilling: false,
    createProject: true,
    editProject: true,
    viewProject: true,
    deleteProject: false,
    reviewCandidate: false,
    manageApiKeys: false,
  },
  viewer: {
    manageOrg: false,
    manageMembers: false,
    manageBilling: false,
    createProject: false,
    editProject: false,
    viewProject: true,
    deleteProject: false,
    reviewCandidate: false,
    manageApiKeys: false,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.owner;
