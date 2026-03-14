import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getCandidate,
  getCandidateComments,
  addCandidateComment,
} from "@/lib/supabase/candidates";
import { supabase } from "@/lib/supabase/client";

const CreateCommentSchema = z.object({
  body: z.string().min(1),
  variantIndex: z.number().int().min(0).optional(),
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

  const comments = await getCandidateComments(candidateId);
  return NextResponse.json(comments);
}

export async function POST(
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Look up the author's display name
  const { data: userData } = await supabase
    .from("layout_user")
    .select("name")
    .eq("id", authResult.userId)
    .single();

  const comment = await addCandidateComment({
    candidateId,
    authorId: authResult.userId,
    authorName: (userData as { name: string } | null)?.name ?? undefined,
    body: parsed.data.body,
    variantIndex: parsed.data.variantIndex,
  });

  if (!comment) {
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }

  return NextResponse.json(comment, { status: 201 });
}
