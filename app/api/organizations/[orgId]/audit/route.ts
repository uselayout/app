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
    limit: Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 200),
    offset: Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0),
  };

  const [entries, total] = await Promise.all([
    getAuditLog(orgId, filters),
    getAuditLogCount(orgId, filters),
  ]);

  return NextResponse.json({ entries, total });
}
