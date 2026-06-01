import { NextResponse } from "next/server";
import JSZip from "jszip";
import { fetchKitBySlug, incrementImportCount } from "@/lib/supabase/kits";

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

  // Rich kits can ship component code. Emit one markdown file per component in
  // the shape the CLI parser expects: the loader wraps each file as
  // "## Components\n### <file>", so the first line is the component name, the
  // token list (- `--x`) bounds the description, and the tsx fence holds the
  // code. The CLI's list-components / get-component tools then pick them up.
  for (const c of kit.richBundle?.components ?? []) {
    const slug = (c.slug || c.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug || !c.code) continue;

    const md: string[] = [c.name, ""];
    if (c.description) md.push(c.description, "");
    if (c.tokensUsed?.length) {
      for (const token of c.tokensUsed) md.push(`- \`${token}\``);
      md.push("");
    }
    md.push("```tsx", c.code, "```", "");
    zip.file(`components/${slug}.md`, md.join("\n"));
  }

  const blob = await zip.generateAsync({ type: "uint8array" });

  // Count CLI installs alongside Studio imports so the gallery's "most imported"
  // ranking reflects both. Best-effort: never block or fail the download.
  try {
    await incrementImportCount(kit.id);
  } catch {
    // ignore — the download is what matters
  }

  return new NextResponse(blob as unknown as BodyInit, {
    headers: {
      ...CORS,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${kit.slug}.zip"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
