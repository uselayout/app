// app/api/plugin/projects/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { fetchAllProjects, upsertProject } from "@/lib/supabase/db";
import { getUserOrganizations, getOrganization } from "@/lib/supabase/organization";
import type { Project } from "@/lib/types";

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

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "write");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: CORS },
    );
  }

  const org = await getOrganization(auth.orgId);
  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404, headers: CORS });
  }

  const projectId =
    crypto.randomUUID?.() ??
    Math.random().toString(36).slice(2) + Date.now().toString(36);

  const now = new Date().toISOString();
  const project: Project = {
    id: projectId,
    orgId: auth.orgId,
    name: parsed.data.name,
    sourceType: "website",
    designMd: "",
    createdAt: now,
    updatedAt: now,
  };

  await upsertProject(project, org.ownerId);

  return NextResponse.json(
    { projectId, name: project.name },
    { status: 201, headers: CORS },
  );
}
