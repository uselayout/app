// app/api/plugin/orgs/route.ts
import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
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
    const organizations = await getUserOrganizations(auth.userId);

    const orgs = organizations.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      logoUrl: o.logoUrl,
    }));

    return NextResponse.json({ orgs }, { headers: CORS });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS }
    );
  }
}
