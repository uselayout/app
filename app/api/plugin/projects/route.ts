// app/api/plugin/projects/route.ts
import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { fetchAllProjects } from "@/lib/supabase/db";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const projects = await fetchAllProjects(auth.orgId);

    const result = projects.map((p) => ({
      id: p.id,
      name: p.name,
      sourceType: p.sourceType,
      sourceUrl: p.sourceUrl,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ projects: result }, { headers: CORS });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS }
    );
  }
}
