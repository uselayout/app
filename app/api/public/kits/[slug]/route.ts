import { NextResponse } from "next/server";
import { fetchKitBySlug } from "@/lib/supabase/kits";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const kit = await fetchKitBySlug(slug);

  if (!kit) {
    return NextResponse.json({ error: "Kit not found" }, { status: 404, headers: CORS });
  }

  // Redact the rich bundle: too large for the detail view, and rich content is
  // only downloaded via the import route or the zip endpoint.
  const { richBundle: _, ...safe } = kit;
  void _;
  return NextResponse.json({ kit: safe }, { headers: CORS });
}
