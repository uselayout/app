// app/api/plugin/tokens/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getTokensByOrg } from "@/lib/supabase/tokens";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const QuerySchema = z.object({
  projectId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    projectId: url.searchParams.get("projectId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400, headers: CORS });
  }

  const tokens = await getTokensByOrg(auth.orgId);

  const byType: Record<string, Array<{ name: string; value: string; cssVariable: string | null }>> = {};
  for (const t of tokens) {
    if (!byType[t.type]) byType[t.type] = [];
    byType[t.type].push({ name: t.name, value: t.value, cssVariable: t.cssVariable });
  }

  return NextResponse.json({ tokens: byType }, { headers: CORS });
}
