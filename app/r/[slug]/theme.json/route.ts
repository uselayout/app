import { NextResponse } from "next/server";
import { fetchKitBySlug } from "@/lib/supabase/kits";
import { compileKitTheme } from "@/lib/registry/kit-theme";

// Serves every gallery kit as a shadcn registry:theme item, straight from
// the database — no build step anywhere:
//   npx shadcn add https://layout.design/r/<slug>/theme.json
// Works in stock shadcn projects (shadcn variable names) and Layout UI
// projects (--layout-* extensions) simultaneously.

export const dynamic = "force-dynamic";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // Themes change only when a kit's style profile regenerates; cache at the
  // edge for 5 minutes and serve stale while revalidating.
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const kit = await fetchKitBySlug(slug);

  if (!kit || kit.status !== "approved" || kit.hidden) {
    return NextResponse.json(
      { error: "Kit not found" },
      { status: 404, headers: HEADERS },
    );
  }

  const theme = compileKitTheme(kit);
  if (!theme) {
    return NextResponse.json(
      {
        error: "Theme not available",
        detail:
          "This kit has no style profile yet, so a theme cannot be compiled. It will appear once the profile is generated.",
      },
      { status: 404, headers: HEADERS },
    );
  }

  return NextResponse.json(theme, { headers: HEADERS });
}
