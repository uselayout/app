import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/api/admin-context";
import { wrapBroadcastHtml } from "@/lib/email/templates/broadcast-wrapper";

const PreviewSchema = z.object({
  bodyHtml: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bodyHtml is required" }, { status: 400 });
  }

  const html = wrapBroadcastHtml(parsed.data.bodyHtml);
  return NextResponse.json({ html });
}
