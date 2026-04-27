import { NextResponse } from "next/server";
import { listPublicKits } from "@/lib/supabase/kits";
import type { KitSort } from "@/lib/types/kit";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const VALID_SORTS: KitSort[] = ["featured", "new", "top"];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const sortParam = url.searchParams.get("sort") ?? "featured";
  const sort: KitSort = (VALID_SORTS as string[]).includes(sortParam)
    ? (sortParam as KitSort)
    : "featured";

  const limit = Math.min(
    Number.parseInt(url.searchParams.get("limit") ?? "60", 10) || 60,
    120
  );
  const offset = Math.max(
    Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
    0
  );

  const kits = await listPublicKits({ tag, q, sort, limit, offset });
  return NextResponse.json({ kits }, { headers: CORS });
}
