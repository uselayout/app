import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAccessRequest } from "@/lib/supabase/invite-codes";

const bodySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address").max(320),
  whatBuilding: z.string().min(1, "Please tell us what you're building").max(2000),
  howHeard: z.string().min(1, "Please tell us how you heard about Layout").max(500),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, email, whatBuilding, howHeard } = parsed.data;

  try {
    await createAccessRequest({ name, email, whatBuilding, howHeard });
  } catch (err) {
    console.error("Failed to save access request:", err);
    return NextResponse.json(
      { error: "Failed to save request" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
