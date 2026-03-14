import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth-context";
import { acceptInvitation } from "@/lib/supabase/organization";

const AcceptSchema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const parsed = AcceptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await acceptInvitation(parsed.data.token, authResult.userId);
  if (!result.success) {
    return Response.json(
      { error: result.error ?? "Invalid or expired invitation" },
      { status: 400 }
    );
  }

  return Response.json(result);
}
