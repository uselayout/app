import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrgMember, getOrganizationBySlug } from "@/lib/supabase/organization";
import {
  ROLE_PERMISSIONS,
  type OrgRole,
  type Permission,
} from "@/lib/types/organization";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AuthResult {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  userId: string;
}

interface OrgAuthResult extends AuthResult {
  orgId: string;
  role: OrgRole;
}

export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  return { session, userId: session.user.id };
}

/** Resolve an orgId that may be a slug to a UUID. */
async function resolveOrgId(orgId: string): Promise<string | null> {
  if (UUID_RE.test(orgId)) return orgId;
  const org = await getOrganizationBySlug(orgId);
  return org?.id ?? null;
}

export async function requireOrgAuth(
  orgId: string,
  requiredPermission?: Permission
): Promise<OrgAuthResult | NextResponse> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { session, userId } = authResult;

  const resolvedOrgId = await resolveOrgId(orgId);
  if (!resolvedOrgId) {
    return NextResponse.json(
      { error: "Organisation not found" },
      { status: 404 }
    );
  }

  const member = await getOrgMember(resolvedOrgId, userId);
  if (!member) {
    return NextResponse.json(
      { error: "Not a member of this organisation" },
      { status: 403 }
    );
  }

  if (requiredPermission && !ROLE_PERMISSIONS[member.role][requiredPermission]) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return { session, userId, orgId: resolvedOrgId, role: member.role };
}
