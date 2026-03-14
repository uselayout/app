import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getCandidate,
  updateCandidateStatus,
  addCandidateComment,
} from "@/lib/supabase/candidates";
import { logAuditEvent } from "@/lib/supabase/audit";

const RejectSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; candidateId: string }> }
) {
  const { orgId, candidateId } = await params;

  const authResult = await requireOrgAuth(orgId, "reviewCandidate");
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

  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await updateCandidateStatus(candidateId, "rejected", authResult.userId);

  if (parsed.data.reason) {
    await addCandidateComment({
      candidateId,
      authorId: authResult.userId,
      body: parsed.data.reason,
    });
  }

  void logAuditEvent({
    orgId,
    actorId: authResult.userId,
    actorName: authResult.session?.user?.name ?? undefined,
    action: "candidate.rejected",
    resourceType: "candidate",
    resourceId: candidateId,
    resourceName: candidate.name,
    details: parsed.data.reason ? { reason: parsed.data.reason } : {},
  });

  return NextResponse.json({ status: "rejected" });
}
