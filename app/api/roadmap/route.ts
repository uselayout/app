import { NextResponse } from "next/server";
import { getRoadmapItems } from "@/lib/supabase/roadmap";

export const revalidate = 60;

export async function GET() {
  try {
    const items = await getRoadmapItems();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch roadmap";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
