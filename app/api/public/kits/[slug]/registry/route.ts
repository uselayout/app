import { NextResponse } from "next/server";
import { fetchKitBySlug } from "@/lib/supabase/kits";
import { generateKitRegistryItem } from "@/lib/registry/kit-registry";

// Serves a registry-enabled gallery kit as a shadcn registry:base item so
// the stock shadcn CLI can install the full kit (token cssVars + .layout/
// files for the Layout MCP server):
//
//   npx shadcn add https://layout.design/api/public/kits/<slug>/registry
//
// Admins opt kits in via the Kits tab ("Enable shadcn registry"). Generator
// mirrors the CLI's canonical layout-context/src/export/registry.ts.

export const dynamic = "force-dynamic";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // Kits are immutable snapshots in practice; cache at the edge for 5
  // minutes and serve stale while revalidating.
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
  // fetchKitBySlug already excludes hidden and non-approved kits.
  const kit = await fetchKitBySlug(slug);

  if (!kit || !kit.registryEnabled) {
    return NextResponse.json(
      { error: "Kit not found" },
      { status: 404, headers: HEADERS },
    );
  }

  return NextResponse.json(generateKitRegistryItem(kit), { headers: HEADERS });
}
