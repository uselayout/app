import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/api/auth-context";
import {
  createKitRequest,
  listKitRequests,
} from "@/lib/supabase/kit-requests";

export const dynamic = "force-dynamic";

const PostBody = z.object({
  url: z.string().min(1).max(500),
});

export async function GET() {
  // List is public read. Resolve a userId opportunistically so logged-in
  // viewers see the upvote toggle pre-filled.
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const requests = await listKitRequests({ userId, limit: 50 });
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json().catch(() => null);
  const parsed = PostBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const result = await createKitRequest({
    url: parsed.data.url,
    userId: authResult.userId,
  });

  if (!result.ok && result.duplicate) {
    return NextResponse.json(
      { error: "Already on the wishlist", duplicate: true, existing: result.existing },
      { status: 409 }
    );
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ request: result.request });
}
