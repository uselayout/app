import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { createInviteCodes } from "@/lib/supabase/invite-codes";
import { supabase } from "@/lib/supabase/client";

const PatchSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  inviteCode: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, inviteCode } = parsed.data;

  // If approving without a code, auto-generate one
  let resolvedCode = inviteCode;
  if (status === "approved" && !resolvedCode) {
    try {
      const [generated] = await createInviteCodes(auth.userId, 1);
      resolvedCode = generated.code;
    } catch (err) {
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : "Failed to generate code",
        },
        { status: 500 }
      );
    }
  }

  const updatePayload: Record<string, string | null> = { status };
  if (resolvedCode) {
    updatePayload.invite_code = resolvedCode;
  }

  const { data, error } = await supabase
    .from("access_requests")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to update access request: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    request: data,
    inviteCode: resolvedCode ?? null,
  });
}
