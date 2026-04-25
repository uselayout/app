import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { approveKit, fetchKitById } from "@/lib/supabase/kits";
import { runKitGenerationJobs } from "@/lib/gallery/run-generation-jobs";

export const dynamic = "force-dynamic";
// Generation jobs are fire-and-forget so this route returns quickly,
// but keep the timeout generous in case the upstream DB write stalls.
export const maxDuration = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const kit = await fetchKitById(id);
  if (!kit) {
    return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  }
  if (kit.status === "approved") {
    return NextResponse.json({ ok: true, alreadyApproved: true });
  }

  // Body may include the admin's BYOK OpenAI key for hero generation.
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const openaiApiKey =
    typeof body?.openaiApiKey === "string" && body.openaiApiKey.trim().length > 0
      ? body.openaiApiKey.trim()
      : undefined;

  const ok = await approveKit(kit.id);
  if (!ok) {
    return NextResponse.json({ error: "Failed to approve kit" }, { status: 500 });
  }

  // Fire showcase + preview + hero jobs in parallel; admin can re-trigger
  // any of them individually from the row if quality is poor.
  const origin = new URL(request.url).origin;
  runKitGenerationJobs({ ...kit, status: "approved" }, origin, openaiApiKey);

  return NextResponse.json({ ok: true });
}
