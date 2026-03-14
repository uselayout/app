import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getApiKeyById, revokeApiKey } from "@/lib/supabase/api-keys";
import { logAuditEvent } from "@/lib/supabase/audit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string; keyId: string }> }
) {
  const { orgId, keyId } = await params;
  const authResult = await requireOrgAuth(orgId, "manageApiKeys");
  if (authResult instanceof NextResponse) return authResult;

  const key = await getApiKeyById(keyId);
  if (!key || key.orgId !== orgId) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  if (key.revokedAt) {
    return NextResponse.json(
      { error: "API key already revoked" },
      { status: 400 }
    );
  }

  await revokeApiKey(keyId, authResult.userId);

  void logAuditEvent({
    orgId,
    actorId: authResult.userId,
    actorName: authResult.session?.user?.name ?? undefined,
    action: "api_key.revoked",
    resourceType: "api_key",
    resourceId: keyId,
    resourceName: key.name,
  });

  return NextResponse.json({ success: true });
}
