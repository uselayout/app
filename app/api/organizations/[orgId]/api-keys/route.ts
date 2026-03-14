import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { createApiKey, getApiKeysByOrg } from "@/lib/supabase/api-keys";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "manageApiKeys");
  if (authResult instanceof NextResponse) return authResult;

  const keys = await getApiKeysByOrg(orgId);
  return NextResponse.json(keys);
}

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(["read", "write"])).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "manageApiKeys");
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const key = await createApiKey({
    orgId,
    name: parsed.data.name,
    scopes: parsed.data.scopes,
    createdBy: authResult.userId,
  });

  if (!key) {
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }

  return NextResponse.json(key, { status: 201 });
}
