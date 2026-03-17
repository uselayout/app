// app/api/plugin/projects/route.ts
import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { fetchAllProjects } from "@/lib/supabase/db";
import { getUserOrganizations } from "@/lib/supabase/organization";

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
    const url = new URL(request.url);
    const requestedOrgId = url.searchParams.get("orgId");

    // If a different org is requested, verify the user belongs to it
    let orgId = auth.orgId;
    if (requestedOrgId && requestedOrgId !== auth.orgId) {
      const userOrgs = await getUserOrganizations(auth.userId);
      const hasAccess = userOrgs.some((o) => o.id === requestedOrgId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied to this organisation" },
          { status: 403, headers: CORS }
        );
      }
      orgId = requestedOrgId;
    }

    const projects = await fetchAllProjects(orgId);

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
