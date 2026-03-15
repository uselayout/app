import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/supabase/api-keys";
import { getOrganization } from "@/lib/supabase/organization";

// CORS headers — Figma plugin sandbox sends requests with origin: null
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const rawKey = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!rawKey) {
    return NextResponse.json(
      { error: "Missing API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const result = await validateApiKey(rawKey);

  if (!result) {
    return NextResponse.json(
      { error: "Invalid or expired API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const org = await getOrganization(result.orgId);

  return NextResponse.json(
    { valid: true, org: { id: result.orgId, name: org?.name ?? null } },
    { headers: CORS_HEADERS }
  );
}
