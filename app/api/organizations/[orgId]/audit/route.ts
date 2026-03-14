import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getAuditLog, getAuditLogCount } from "@/lib/supabase/audit";
import type { AuditLogFilters } from "@/lib/supabase/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageOrg");
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(request.url);
  const filters: AuditLogFilters = {
    action: url.searchParams.get("action") ?? undefined,
    resourceType: url.searchParams.get("resourceType") ?? undefined,
    actorId: url.searchParams.get("actorId") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 50,
    offset: url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!, 10) : 0,
  };

  const [entries, total] = await Promise.all([
    getAuditLog(orgId, filters),
    getAuditLogCount(orgId, filters),
  ]);

  return NextResponse.json({ entries, total });
}
