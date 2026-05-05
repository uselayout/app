import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  deleteComponent,
  getComponent,
  getComponentsByProject,
  updateComponent,
  updateComponentCode,
} from "@/lib/supabase/components";
import { fetchProjectById } from "@/lib/supabase/db";
import { supabase } from "@/lib/supabase/client";
import { syncComponentsSection } from "@/lib/layout-md/sync-components-section";
import type { EditSchema } from "@/lib/types/component";

const UpdateComponentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "approved", "deprecated"]).optional(),
  code: z.string().optional(),
  compiledJs: z.string().optional(),
  changeSummary: z.string().optional(),
  props: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  states: z.array(z.any()).optional(),
  editSchema: z.unknown().optional(),
  linkedComponentName: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; componentId: string }> }
) {
  const { orgId, componentId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const component = await getComponent(componentId);
  if (!component || component.orgId !== orgId) {
    return NextResponse.json(
      { error: "Component not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(component);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; componentId: string }> }
) {
  const { orgId, componentId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const component = await getComponent(componentId);
  if (!component || component.orgId !== orgId) {
    return NextResponse.json(
      { error: "Component not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateComponentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    code,
    compiledJs,
    changeSummary,
    editSchema,
    linkedComponentName,
    ...metadataUpdates
  } = parsed.data;

  if (code !== undefined) {
    await updateComponentCode(
      componentId,
      code,
      compiledJs ?? null,
      authResult.userId,
      changeSummary ?? null
    );
  }

  // Apply metadata updates (and edit_schema / linked_component_name when set)
  const hasMetadataUpdates =
    Object.values(metadataUpdates).some((v) => v !== undefined) ||
    editSchema !== undefined ||
    linkedComponentName !== undefined;
  if (hasMetadataUpdates) {
    await updateComponent(componentId, {
      ...metadataUpdates,
      editSchema: editSchema as EditSchema | null | undefined,
      linkedComponentName,
    });
  }

  const updated = await getComponent(componentId);

  // Auto-sync layout.md Section 5 whenever a linked component is mutated.
  // Fire-and-forget so the response stays snappy for the editor.
  if (updated && updated.linkedComponentName && updated.projectId) {
    void autoSyncLayoutMd(orgId, updated.projectId);
  }

  return NextResponse.json(updated);
}

/**
 * Re-render Section 5 of layout.md from the project's imported components +
 * currently-saved linked components, then write it back. Logs and swallows
 * errors so a sync failure never propagates back to the user's save.
 */
async function autoSyncLayoutMd(orgId: string, projectId: string): Promise<void> {
  try {
    const project = await fetchProjectById(projectId);
    if (!project || project.orgId !== orgId) return;
    const linked = await getComponentsByProject(orgId, projectId);
    const newLayoutMd = syncComponentsSection({
      layoutMd: project.layoutMd ?? "",
      importedComponents: project.extractionData?.components ?? [],
      linkedComponents: linked,
    });
    if (newLayoutMd === project.layoutMd) return;
    const { error } = await supabase
      .from("layout_projects")
      .update({ layout_md: newLayoutMd, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("org_id", orgId);
    if (error) {
      console.error("layout.md auto-sync failed:", error.message);
    }
  } catch (err) {
    console.error("layout.md auto-sync exception:", err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; componentId: string }> }
) {
  const { orgId, componentId } = await params;

  const authResult = await requireOrgAuth(orgId, "deleteProject");
  if (authResult instanceof NextResponse) return authResult;

  const component = await getComponent(componentId);
  if (!component || component.orgId !== orgId) {
    return NextResponse.json(
      { error: "Component not found" },
      { status: 404 }
    );
  }

  await deleteComponent(componentId);
  return new NextResponse(null, { status: 204 });
}
