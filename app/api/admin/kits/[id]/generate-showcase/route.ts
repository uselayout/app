import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { fetchKitById, setBespokeShowcase, updateKitShowcase } from "@/lib/supabase/kits";
import { generateKitShowcase } from "@/lib/claude/generate-kit-showcase";

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
    const result = await generateKitShowcase({
      kitName: kit.name,
      kitDescription: kit.description,
      kitTags: kit.tags,
      layoutMd: kit.layoutMd,
      tokensCss: kit.tokensCss,
      brandingAssets: kit.richBundle?.brandingAssets,
    });
    const ok = await updateKitShowcase(kit.id, result.tsx, result.js);
    if (!ok) {
      return NextResponse.json({ error: "Failed to save showcase" }, { status: 500 });
    }
    // Triggering a regen implicitly opts the kit into bespoke mode so the
    // detail page actually serves the new output. Admin can flip back to
    // uniform via the PATCH route or the KitsTab dropdown.
    if (!kit.bespokeShowcase) await setBespokeShowcase(kit.id, true);
    return NextResponse.json({ ok: true, length: result.tsx.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
