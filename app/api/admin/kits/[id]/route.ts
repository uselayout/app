import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

const PatchBody = z.object({
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
  unlisted: z.boolean().optional(),
  cardImagePref: z.enum(["auto", "custom", "hero", "preview"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const parsed = PatchBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Map camelCase API field to snake_case DB column.
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("featured" in parsed.data) update.featured = parsed.data.featured;
  if ("hidden" in parsed.data) update.hidden = parsed.data.hidden;
  if ("unlisted" in parsed.data) update.unlisted = parsed.data.unlisted;
  if ("cardImagePref" in parsed.data) update.card_image_pref = parsed.data.cardImagePref;

  const { error } = await supabase
    .from("layout_public_kit")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const { error } = await supabase.from("layout_public_kit").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
