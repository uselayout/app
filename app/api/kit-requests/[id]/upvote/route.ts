import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-context";
import {
  fetchKitRequestById,
  toggleRequestUpvote,
} from "@/lib/supabase/kit-requests";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const existing = await fetchKitRequestById(id);
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const upvoted = await toggleRequestUpvote(id, authResult.userId);
  return NextResponse.json({ upvoted });
}
