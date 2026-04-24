import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

// List every kit including hidden + unlisted so admins can moderate.
export async function GET(request: Request) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase
    .from("layout_public_kit")
    .select(
      "id, slug, name, description, tags, author_org_id, author_display_name, licence, tier, featured, hidden, unlisted, upvote_count, import_count, created_at, updated_at, showcase_generated_at, preview_generated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ kits: data ?? [] });
}
