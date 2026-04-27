import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";

/**
 * Returns the set of kit slugs that already exist on the destination
 * environment, so the admin UI can show a "Live on prod" badge per row.
 *
 * Queries the destination's Supabase REST endpoint with the service-role key
 * we already have configured for promote uploads. One round-trip, returns
 * just the slugs.
 *
 * Returns { promotedSlugs: string[], configured: boolean, error?: string }.
 *
 * If PROD_SUPABASE_URL or PROD_SUPABASE_SERVICE_ROLE_KEY is unset (e.g.
 * running on production itself), returns `configured: false` and an empty
 * array — the UI hides the badge in that case.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const destSupabaseUrl = process.env.PROD_SUPABASE_URL;
  const destServiceRole = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
  if (!destSupabaseUrl || !destServiceRole) {
    return NextResponse.json({ promotedSlugs: [], configured: false });
  }

  try {
    const url = `${destSupabaseUrl.replace(/\/$/, "")}/rest/v1/layout_public_kit?select=slug`;
    const resp = await fetch(url, {
      headers: {
        apikey: destServiceRole,
        Authorization: `Bearer ${destServiceRole}`,
        accept: "application/json",
      },
      next: { revalidate: 30 },
    });
    if (!resp.ok) {
      return NextResponse.json({
        promotedSlugs: [],
        configured: true,
        error: `dest ${resp.status}`,
      });
    }
    const body = (await resp.json()) as Array<{ slug: string }>;
    const slugs = body.map((row) => row.slug);
    return NextResponse.json({ promotedSlugs: slugs, configured: true });
  } catch (err) {
    return NextResponse.json({
      promotedSlugs: [],
      configured: true,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
