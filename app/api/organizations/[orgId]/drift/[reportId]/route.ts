import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getDriftReportById,
  updateDriftReportStatus,
} from "@/lib/supabase/drift";

const PatchSchema = z.object({
  status: z.enum(["pending", "reviewed", "resolved"]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; reportId: string }> }
) {
  const { orgId, reportId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const report = await getDriftReportById(reportId);
  if (!report || report.orgId !== orgId) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; reportId: string }> }
) {
  const { orgId, reportId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = await getDriftReportById(reportId);
  if (!report || report.orgId !== orgId) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  await updateDriftReportStatus(
    reportId,
    parsed.data.status,
    authResult.userId
  );

  const updated = await getDriftReportById(reportId);
  return NextResponse.json(updated);
}
