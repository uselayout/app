import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { fetchKitById, updateKitStyleProfile } from "@/lib/supabase/kits";
import { generateKitStyleProfile } from "@/lib/claude/generate-kit-style-profile";

// Triggers Claude to derive a fresh KitStyleProfile from the kit's
// layout.md + tokens.css and persists it to layout_public_kit.
// The uniform Live Preview reads this profile via window.__KIT__ and
// uses it to drive button radii, fill styles, input focus, card
// elevation, badge shape, tab indicator, etc.
//
// Cheap (~$0.005/kit, small JSON output) and the renderer falls back
// to DEFAULT_STYLE_PROFILE if generation fails — so this never blocks
// the kit's gallery page from rendering.

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

  try {
    const profile = await generateKitStyleProfile({
      kitName: kit.name,
      kitDescription: kit.description,
      kitTags: kit.tags,
      layoutMd: kit.layoutMd,
      tokensCss: kit.tokensCss,
    });
    const ok = await updateKitStyleProfile(kit.id, profile);
    if (!ok) {
      return NextResponse.json({ error: "Failed to save style profile" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
