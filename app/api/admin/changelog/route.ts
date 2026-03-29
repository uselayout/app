import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { draftEntries, publishedWeeks } from "@/content/changelog";
import { compileDraft, publishWeek, writeDraftEntries } from "@/lib/changelog/publish";
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

const publishSchema = z.object({
  weekId: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  items: z.array(
    z.object({
      text: z.string().min(1),
      product: z.enum(["studio", "cli", "figma-plugin", "chrome-extension"]),
      category: z.enum(["new", "improved", "fixed"]),
    })
  ),
});

// GET: return draft entries, compiled preview, and recent published weeks
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const compiled =
    draftEntries.length > 0 ? compileDraft(draftEntries) : null;

  return NextResponse.json({
    draft: draftEntries,
    compiled,
    published: publishedWeeks.slice(0, 5),
  });
}

// POST: publish a compiled weekly entry
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const week = publishSchema.parse(body);
    publishWeek(week);
    return NextResponse.json({
      success: true,
      weekId: week.weekId,
      label: week.label,
      entryCount: week.items.length,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid week data", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PUT: update draft entries
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
