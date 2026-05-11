import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { listUnpaidConversions } from "@/lib/supabase/affiliates";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const conversions = await listUnpaidConversions();
    return NextResponse.json({ conversions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list conversions" },
      { status: 500 }
    );
  }
}
