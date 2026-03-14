import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getCandidate, deleteCandidate } from "@/lib/supabase/candidates";
import { supabase } from "@/lib/supabase/client";

const UpdateCandidateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; candidateId: string }> }
) {
  const { orgId, candidateId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.orgId !== orgId) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(candidate);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; candidateId: string }> }
) {
  const { orgId, candidateId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.orgId !== orgId) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateCandidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined)
    updates.description = parsed.data.description;
  if (parsed.data.category !== undefined)
    updates.category = parsed.data.category;

  await supabase
    .from("layout_candidate")
    .update(updates)
    .eq("id", candidateId);

  const updated = await getCandidate(candidateId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; candidateId: string }> }
) {
  const { orgId, candidateId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.orgId !== orgId) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  await deleteCandidate(candidateId);
  return new NextResponse(null, { status: 204 });
}
