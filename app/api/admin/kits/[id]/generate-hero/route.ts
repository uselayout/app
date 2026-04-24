import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { fetchKitById, updateKitHeroImage } from "@/lib/supabase/kits";
import { captureAndUploadKitHero } from "@/lib/gallery/hero";

export const dynamic = "force-dynamic";
// GPT Image 2 generation can take 20-40s; give room before timeout.
export const maxDuration = 60;

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

  const heroUrl = await captureAndUploadKitHero(kit);
  if (!heroUrl) {
    return NextResponse.json(
      { error: "Hero generation failed. Check that OPENAI_API_KEY is set on the server." },
      { status: 500 },
    );
  }

  const ok = await updateKitHeroImage(kit.id, heroUrl);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save hero URL" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, heroUrl });
}
