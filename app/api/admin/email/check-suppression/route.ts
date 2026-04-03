import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { getSuppressedEmails } from "@/lib/email/suppression";
import { z } from "zod";

const Schema = z.object({
  emails: z.array(z.string().email()),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const suppressed = await getSuppressedEmails(parsed.data.emails);

  return NextResponse.json({ suppressed: [...suppressed] });
}
