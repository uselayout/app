import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { fetchKitById } from "@/lib/supabase/kits";

// Returns the kit data the local bespoke-regen script needs to call
// Claude. Read-only, ~50KB response (mostly layout.md). The script then
// runs generateKitShowcase + transpileTsx on the user's Mac and POSTs
// the result back to /api/admin/kits/[id]/showcase. Keeps Claude
// streaming + TypeScript transpile off the staging server entirely.

export async function GET(
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

  return NextResponse.json({
    id: kit.id,
    slug: kit.slug,
    kitName: kit.name,
    kitDescription: kit.description,
    kitTags: kit.tags,
    layoutMd: kit.layoutMd,
    tokensCss: kit.tokensCss,
    brandingAssets: kit.richBundle?.brandingAssets,
  });
}
