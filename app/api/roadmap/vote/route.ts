import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { toggleVote } from "@/lib/supabase/roadmap";

const voteSchema = z.object({
  itemId: z.string().min(1),
  voterId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = voteSchema.parse(body);

    // If authenticated, use their user ID as voterId
    let voterId = parsed.voterId;
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user?.id) {
      voterId = session.user.id;
    }

    const result = await toggleVote(parsed.itemId, voterId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid vote data", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Vote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
