import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  deleteComponent,
  getComponent,
  updateComponent,
  updateComponentCode,
} from "@/lib/supabase/components";

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

  const { code, compiledJs, changeSummary, ...metadataUpdates } = parsed.data;

  if (code !== undefined) {
    await updateComponentCode(
      componentId,
      code,
      compiledJs ?? null,
      authResult.userId,
      changeSummary ?? null
    );
  }

  // Apply metadata updates if any non-code fields were provided
  const hasMetadataUpdates = Object.values(metadataUpdates).some(
    (v) => v !== undefined
  );
  if (hasMetadataUpdates) {
    await updateComponent(componentId, metadataUpdates);
  }

  const updated = await getComponent(componentId);
  return NextResponse.json(updated);
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
