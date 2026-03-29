import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { draftEntries, publishedWeeks } from "@/content/changelog";
import { publishDraft } from "@/lib/changelog/publish";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    draft: draftEntries,
    published: publishedWeeks.slice(0, 5),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const result = publishDraft();
    return NextResponse.json({
      success: true,
      weekId: result.weekId,
      label: result.label,
      entryCount: result.entryCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
