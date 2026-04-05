import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

    const raw = await request.json();

    const ProjectUpdateSchema = z.object({
      id: z.string(),
      name: z.string(),
      sourceType: z.enum(["figma", "website", "manual"]),
      sourceUrl: z.string().optional(),
      layoutMd: z.string(),
      extractionData: z.record(z.string(), z.unknown()).nullable().optional(),
      tokenCount: z.number().nullable().optional(),
      healthScore: z.number().nullable().optional(),
      explorations: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
      iconPacks: z.array(z.string()).nullable().optional(),
      uploadedFonts: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
      pendingCanvasImage: z.string().nullable().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
    });

    const parsed = ProjectUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const body = parsed.data;
    if (body.id !== projectId) {
      return NextResponse.json({ error: "Project ID mismatch" }, { status: 400 });
    }

    // Ensure the project is saved under the resolved org UUID
    const project = { ...body, orgId: authResult.orgId };

    await upsertProject(project as Parameters<typeof upsertProject>[0], authResult.userId);
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
