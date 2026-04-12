import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/logging/platform-event";

const schema = z.object({
  variantId: z.string(),
  variantName: z.string().optional(),
  rating: z.enum(["up", "down"]),
  prompt: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { variantId, variantName, rating, prompt, userId } = parsed.data;

  void logEvent("variant.rated", "studio", {
    userId: userId ?? undefined,
    metadata: { variantId, variantName, rating, prompt },
  });

  return NextResponse.json({ ok: true });
}
