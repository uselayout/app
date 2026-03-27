import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email parameter is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("layout_user")
    .select("id, email, name")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `Lookup failed: ${error.message}` },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    userId: data.id,
    email: data.email,
    name: data.name,
  });
}
