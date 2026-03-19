import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("layout_projects")
    .update({ pending_canvas_image: null })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
