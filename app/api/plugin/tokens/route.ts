// app/api/plugin/tokens/route.ts
import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "read");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  try {
    const tokens = await getTokensByOrg(auth.orgId);

    const byType: Record<string, Array<{ name: string; value: string; cssVariable: string | null }>> = {};
    for (const t of tokens) {
      if (!byType[t.type]) byType[t.type] = [];
      byType[t.type].push({ name: t.name, value: t.value, cssVariable: t.cssVariable });
    }

    return NextResponse.json({ tokens: byType }, { headers: CORS });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}
