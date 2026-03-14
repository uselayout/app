import { NextResponse } from "next/server";
import { getPublishedTemplates } from "@/lib/supabase/templates";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const featured = url.searchParams.get("featured");

  const templates = await getPublishedTemplates({
    category: category ?? undefined,
    search: search ?? undefined,
    featured: featured === "true" ? true : undefined,
  });

  return NextResponse.json(templates);
}
