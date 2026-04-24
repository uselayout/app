import { NextResponse } from "next/server";
import JSZip from "jszip";
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

  const zip = new JSZip();
  zip.file("layout.md", kit.layoutMd);
  zip.file("tokens.css", kit.tokensCss);
  zip.file("tokens.json", JSON.stringify(kit.tokensJson, null, 2));
  zip.file("kit.json", JSON.stringify(kit.kitJson, null, 2));

  const licenceBody = kit.licence === "custom"
    ? kit.licenceCustom ?? "All rights reserved."
    : `Licensed under ${kit.licence}. See https://spdx.org/licenses/${kit.licence}.html for full text.`;
  zip.file("LICENCE.txt", licenceBody);

  const blob = await zip.generateAsync({ type: "uint8array" });

  return new NextResponse(blob as unknown as BodyInit, {
    headers: {
      ...CORS,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${kit.slug}.zip"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
