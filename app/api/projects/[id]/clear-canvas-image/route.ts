import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { requireProjectAccess } from "@/lib/api/project-context";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;

  const access = await requireProjectAccess(id);
  if (access instanceof NextResponse) return access;

  await supabase
    .from("layout_projects")
    .update({ pending_canvas_image: null })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
