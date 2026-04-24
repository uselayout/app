import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { fetchKitById, updateKitPreviewImage } from "@/lib/supabase/kits";
import { captureAndUploadKitPreview } from "@/lib/gallery/snapshot";

export const dynamic = "force-dynamic";
// Playwright browser launch + navigate + screenshot easily exceeds Next's
// default function timeout. Give it more room on long-running kits.
export const maxDuration = 60;

function resolveBaseUrl(request: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

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

  const baseUrl = resolveBaseUrl(request);
  const previewUrl = await captureAndUploadKitPreview(kit.id, kit.slug, baseUrl);
  if (!previewUrl) {
    return NextResponse.json({ error: "Playwright snapshot failed" }, { status: 500 });
  }

  const ok = await updateKitPreviewImage(kit.id, previewUrl);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save preview URL" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, previewUrl });
}
