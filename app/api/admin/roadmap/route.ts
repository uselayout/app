import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { z } from "zod";
import { getRoadmapItems, createRoadmapItem } from "@/lib/supabase/roadmap";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  product: z.enum(["studio", "cli", "figma-plugin", "chrome-extension"]),
  status: z.enum(["planned", "in-progress", "shipped", "considering"]),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const items = await getRoadmapItems();
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch roadmap";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const item = await createRoadmapItem(parsed);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid roadmap item", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
