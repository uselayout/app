import { validateApiKey } from "@/lib/supabase/api-keys";
import { NextResponse } from "next/server";
import type { ApiKeyScope } from "@/lib/types/api-key";

export interface McpAuthResult {
  orgId: string;
  keyId: string;
  userId: string;
  scopes: ApiKeyScope[];
}

export async function requireMcpAuth(
  request: Request,
  requiredScope?: ApiKeyScope
): Promise<McpAuthResult | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  const rawKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!rawKey) {
    return NextResponse.json(
      { error: "Missing Authorization header. Use: Bearer lyt_..." },
      { status: 401 }
    );
  }

  const result = await validateApiKey(rawKey);
  if (!result) {
    return NextResponse.json(
      { error: "Invalid or revoked API key" },
      { status: 401 }
    );
  }

  if (requiredScope && !result.apiKey.scopes.includes(requiredScope)) {
    return NextResponse.json(
      { error: `API key missing required scope: ${requiredScope}` },
      { status: 403 }
    );
  }

  return {
    orgId: result.orgId,
    keyId: result.apiKey.id,
    userId: result.apiKey.createdBy,
    scopes: result.apiKey.scopes as ApiKeyScope[],
  };
}
