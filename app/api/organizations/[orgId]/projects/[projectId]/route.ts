import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchProjectById, upsertProject, removeProject } from "@/lib/supabase/db";

type Params = { params: Promise<{ orgId: string; projectId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { orgId, projectId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const project = await fetchProjectById(projectId);
  if (!project || project.orgId !== orgId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { orgId, projectId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  if (body.id !== projectId || body.orgId !== orgId) {
    return NextResponse.json({ error: "Project ID / org mismatch" }, { status: 400 });
  }

  await upsertProject(body, authResult.userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { orgId, projectId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  await removeProject(projectId, orgId);
  return NextResponse.json({ ok: true });
}
