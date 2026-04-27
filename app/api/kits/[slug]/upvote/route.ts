import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-context";
import { fetchKitBySlug, toggleUpvote } from "@/lib/supabase/kits";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const kit = await fetchKitBySlug(slug);
  if (!kit) {
    return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  }

  const upvoted = await toggleUpvote(kit.id, userId);
  return NextResponse.json({ upvoted });
}
