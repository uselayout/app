import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getApiKeyById, revokeApiKey } from "@/lib/supabase/api-keys";


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

  return NextResponse.json({ success: true });
}
