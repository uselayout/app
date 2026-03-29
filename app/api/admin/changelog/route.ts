import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { draftEntries, publishedWeeks } from "@/content/changelog";
import { publishDraft, writeDraftEntries } from "@/lib/changelog/publish";
import type { ChangelogEntry } from "@/lib/types/changelog";
import { z } from "zod";

const entrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  product: z.enum(["studio", "cli", "figma-plugin", "chrome-extension"]),
  category: z.enum(["new", "improved", "fixed"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    draft: draftEntries,
    published: publishedWeeks.slice(0, 5),
  });
}

// Publish draft
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

// Update draft entries (full replacement)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = z.array(entrySchema).parse(body.entries);
    writeDraftEntries(parsed as ChangelogEntry[]);
    return NextResponse.json({ success: true, count: parsed.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid entry data", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
