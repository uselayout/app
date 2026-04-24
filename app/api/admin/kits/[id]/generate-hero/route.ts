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

  // Prefer key from request body (survives proxy header stripping), then
  // common header variants, then server env.
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const bodyKey = typeof body?.openaiApiKey === "string" ? body.openaiApiKey.trim() : "";
  const headerKey =
    request.headers.get("x-openai-api-key")?.trim() ??
    request.headers.get("x-openai-key")?.trim() ??
    "";
  const authHeader = request.headers.get("authorization") ?? "";
  const authKey = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  const openaiApiKey = bodyKey || headerKey || authKey || process.env.OPENAI_API_KEY;

  console.log(`[generate-hero] key source: ${bodyKey ? "body" : headerKey ? "header" : authKey ? "authorization" : openaiApiKey ? "env" : "none"}`);

  if (!openaiApiKey) {
    return NextResponse.json(
      { error: "OpenAI API key required. Add it in Settings > API Keys or set OPENAI_API_KEY on the server." },
      { status: 400 },
    );
  }

  const heroUrl = await captureAndUploadKitHero(kit, { openaiApiKey });
  if (!heroUrl) {
    return NextResponse.json(
      { error: "Hero generation failed. Check the OpenAI API key and quota." },
      { status: 500 },
    );
  }

  const ok = await updateKitHeroImage(kit.id, heroUrl);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save hero URL" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, heroUrl });
}
