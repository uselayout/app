import { NextResponse } from "next/server";
import { getTemplateBySlug } from "@/lib/supabase/templates";
import { getTokensByOrg } from "@/lib/supabase/tokens";
import { getComponentsByOrg } from "@/lib/supabase/components";
import { getTypefacesByOrg } from "@/lib/supabase/typography";
import type { TemplatePreview } from "@/lib/types/template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const template = await getTemplateBySlug(slug);
  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  // Build preview data from source org assets
  const [tokens, components, typefaces] = await Promise.all([
    getTokensByOrg(template.sourceOrgId),
    getComponentsByOrg(template.sourceOrgId, { status: "approved" }),
    getTypefacesByOrg(template.sourceOrgId),
  ]);

  const tokenCounts = {
    colors: tokens.filter((t) => t.type === "color").length,
    spacing: tokens.filter((t) => t.type === "spacing").length,
    typography: tokens.filter((t) => t.type === "typography").length,
    radius: tokens.filter((t) => t.type === "radius").length,
    effects: tokens.filter((t) => t.type === "effect").length,
  };

  // Strip internal sourceOrgId from public response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured to exclude from response
  const { sourceOrgId: _stripped, ...publicTemplate } = template;

  const preview: Omit<TemplatePreview, "sourceOrgId"> & { tokens: typeof tokenCounts; componentNames: string[]; typefaceNames: string[] } = {
    ...publicTemplate,
    tokens: tokenCounts,
    componentNames: components.map((c) => c.name),
    typefaceNames: typefaces.map((t) => t.family),
  };

  return NextResponse.json(preview);
}
