import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchProjectById, upsertProject, removeProject } from "@/lib/supabase/db";

type Params = { params: Promise<{ orgId: string; projectId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { orgId, projectId } = await params;

    const authResult = await requireOrgAuth(orgId, "viewProject");
    if (authResult instanceof NextResponse) return authResult;

    const project = await fetchProjectById(projectId);
    if (!project || project.orgId !== authResult.orgId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (err) {
    console.error("GET project error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { orgId, projectId } = await params;

    const authResult = await requireOrgAuth(orgId, "editProject");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    if (body.id !== projectId) {
      return NextResponse.json({ error: "Project ID mismatch" }, { status: 400 });
    }

    // Ensure the project is saved under the resolved org UUID
    body.orgId = authResult.orgId;

    await upsertProject(body, authResult.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT project error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { orgId, projectId } = await params;

    const authResult = await requireOrgAuth(orgId, "editProject");
    if (authResult instanceof NextResponse) return authResult;

    await removeProject(projectId, authResult.orgId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE project error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
