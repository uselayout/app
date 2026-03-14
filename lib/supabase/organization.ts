import { supabase } from "./client";
import type {
  Organization,
  OrgMember,
  OrgInvitation,
  OrgRole,
} from "@/lib/types/organization";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface MemberRow {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  joined_at: string;
  user_name?: string;
  user_email?: string;
  user_image?: string;
}

interface InvitationRow {
  id: string;
  org_id: string;
  email: string;
  role: Exclude<OrgRole, "owner">;
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToOrg(row: OrgRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMember(row: MemberRow): OrgMember {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    role: row.role,
    invitedBy: row.invited_by,
    joinedAt: row.joined_at,
    userName: row.user_name,
    userEmail: row.user_email,
    userImage: row.user_image,
  };
}

function rowToInvitation(row: InvitationRow): OrgInvitation {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export function isValidSlug(slug: string): boolean {
  if (slug.length < 3 || slug.length > 48) return false;
  return SLUG_REGEX.test(slug);
}

export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// ─── Organisation CRUD ───────────────────────────────────────────────────────

export async function getOrganization(
  id: string
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("layout_organization")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToOrg(data as OrgRow);
}

export async function getOrganizationBySlug(
  slug: string
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("layout_organization")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToOrg(data as OrgRow);
}

export async function getUserOrganizations(
  userId: string
): Promise<Organization[]> {
  const { data: memberRows, error: memberError } = await supabase
    .from("layout_organization_member")
    .select("org_id")
    .eq("user_id", userId);

  if (memberError || !memberRows || memberRows.length === 0) return [];

  const orgIds = (memberRows as Array<{ org_id: string }>).map(
    (r) => r.org_id
  );

  const { data, error } = await supabase
    .from("layout_organization")
    .select("*")
    .in("id", orgIds)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as OrgRow[]).map(rowToOrg);
}

export async function getPersonalOrg(
  userId: string
): Promise<Organization | null> {
  const orgs = await getUserOrganizations(userId);
  return orgs.find((o) => o.slug.startsWith("personal-")) ?? null;
}

export async function createOrganization(
  name: string,
  slug: string,
  ownerId: string,
  logoUrl: string | null = null
): Promise<Organization | null> {
  const now = new Date().toISOString();
  const orgId = crypto.randomUUID();

  const { error: orgError } = await supabase
    .from("layout_organization")
    .insert({
      id: orgId,
      name,
      slug,
      logo_url: logoUrl,
      owner_id: ownerId,
      created_at: now,
      updated_at: now,
    });

  if (orgError) {
    console.error("Failed to create organisation:", orgError.message);
    return null;
  }

  // Add owner as member
  const { error: memberError } = await supabase
    .from("layout_organization_member")
    .insert({
      id: crypto.randomUUID(),
      org_id: orgId,
      user_id: ownerId,
      role: "owner",
      invited_by: null,
      joined_at: now,
    });

  if (memberError) {
    console.error("Failed to add owner as member:", memberError.message);
  }

  return {
    id: orgId,
    name,
    slug,
    logoUrl,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };
}

export async function ensurePersonalOrg(
  userId: string,
  userName?: string
): Promise<Organization> {
  const existing = await getPersonalOrg(userId);
  if (existing) return existing;

  const name = userName ? `${userName}'s Space` : "Personal";
  const slug = `personal-${userId.slice(0, 8)}-${Date.now().toString(36)}`;
  const org = await createOrganization(name, slug, userId);

  if (!org) {
    throw new Error("Failed to create personal organisation");
  }

  return org;
}

export async function updateOrganization(
  id: string,
  updates: Partial<Pick<Organization, "name" | "slug" | "logoUrl">>
): Promise<Organization | null> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.slug !== undefined) row.slug = updates.slug;
  if (updates.logoUrl !== undefined) row.logo_url = updates.logoUrl;

  const { data, error } = await supabase
    .from("layout_organization")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update organisation:", error?.message);
    return null;
  }

  return rowToOrg(data as OrgRow);
}

// ─── Member CRUD ──────────────────────────────────────────────────────────────

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("layout_organization_member")
    .select("*")
    .eq("org_id", orgId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];
  return (data as MemberRow[]).map(rowToMember);
}

export async function getOrgMember(
  orgId: string,
  userId: string
): Promise<OrgMember | null> {
  const { data, error } = await supabase
    .from("layout_organization_member")
    .select("*")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToMember(data as MemberRow);
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: OrgRole
): Promise<OrgMember | null> {
  const { data, error } = await supabase
    .from("layout_organization_member")
    .update({ role })
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update member role:", error?.message);
    return null;
  }

  return rowToMember(data as MemberRow);
}

export async function removeMember(
  orgId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("layout_organization_member")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to remove member:", error.message);
    return false;
  }

  return true;
}

// ─── Invitation CRUD ──────────────────────────────────────────────────────────

export async function createInvitation(
  orgId: string,
  email: string,
  role: Exclude<OrgRole, "owner">,
  invitedBy: string
): Promise<OrgInvitation | null> {
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString(); // 7 days
  const token = crypto.randomUUID();

  // Upsert: if an invitation for this org+email already exists, update it
  const { data, error } = await supabase
    .from("layout_invitation")
    .upsert(
      {
        id: crypto.randomUUID(),
        org_id: orgId,
        email,
        role,
        invited_by: invitedBy,
        token,
        expires_at: expiresAt,
        created_at: now,
      },
      { onConflict: "org_id,email" }
    )
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create invitation:", error?.message);
    return null;
  }

  return rowToInvitation(data as InvitationRow);
}

export async function getInvitationByToken(
  token: string
): Promise<OrgInvitation | null> {
  const { data, error } = await supabase
    .from("layout_invitation")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return null;
  return rowToInvitation(data as InvitationRow);
}

export async function getOrgInvitations(
  orgId: string
): Promise<OrgInvitation[]> {
  const { data, error } = await supabase
    .from("layout_invitation")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as InvitationRow[]).map(rowToInvitation);
}

export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; orgId?: string; error?: string }> {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return { success: false, error: "Invitation not found" };
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    return { success: false, error: "Invitation has expired" };
  }

  // Add as member
  const { error: memberError } = await supabase
    .from("layout_organization_member")
    .insert({
      id: crypto.randomUUID(),
      org_id: invitation.orgId,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invitedBy,
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    // Might already be a member
    if (memberError.code === "23505") {
      return { success: false, error: "Already a member of this organisation" };
    }
    console.error("Failed to accept invitation:", memberError.message);
    return { success: false, error: "Failed to join organisation" };
  }

  // Delete the invitation
  await supabase.from("layout_invitation").delete().eq("id", invitation.id);

  return { success: true, orgId: invitation.orgId };
}

export async function deleteInvitation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("layout_invitation")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete invitation:", error.message);
    return false;
  }

  return true;
}
