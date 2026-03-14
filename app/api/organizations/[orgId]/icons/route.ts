import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  createIcon,
  getIconsByOrg,
} from "@/lib/supabase/icons";

const CreateIconSchema = z.object({
  name: z.string().min(1).max(100),
  svg: z.string().min(1),
  viewbox: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sizes: z.array(z.number()).optional(),
  strokeWidth: z.number().optional(),
  source: z.enum(["upload", "figma", "library"]).optional(),
  libraryName: z.string().optional(),
});

// Allowlist-based SVG sanitisation
const ALLOWED_SVG_ELEMENTS = new Set([
  "svg", "path", "circle", "ellipse", "line", "polyline", "polygon",
  "rect", "g", "defs", "clippath", "mask", "use", "symbol",
  "lineargradient", "radialgradient", "stop", "title", "desc", "text", "tspan",
]);

const BLOCKED_ATTRIBUTES = /^(on\w+|xlink:href|href|formaction|action|style)$/i;
const DANGEROUS_HREF = /^\s*(javascript|data|vbscript):/i;

export function sanitiseSvg(svg: string): string {
  // Remove all tags not in allowlist (including script, foreignObject, iframe, etc.)
  let clean = svg.replace(/<\/?([a-z][a-z0-9-]*)[^>]*\/?>/gi, (match, tagName: string) => {
    if (!ALLOWED_SVG_ELEMENTS.has(tagName.toLowerCase())) return "";
    // Strip dangerous attributes from allowed tags
    return match.replace(/\s+([a-z][a-z0-9-:]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi,
      (attrMatch, attrName: string, attrValue: string) => {
        if (BLOCKED_ATTRIBUTES.test(attrName)) return "";
        // Check href values for javascript: protocol
        if (/^(href|xlink:href)$/i.test(attrName) && DANGEROUS_HREF.test(attrValue.replace(/["']/g, ""))) return "";
        return attrMatch;
      }
    );
  });
  // Remove CDATA sections and HTML comments that could hide payloads
  clean = clean.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  clean = clean.replace(/<!--[\s\S]*?-->/g, "");
  return clean;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");

  const icons = await getIconsByOrg(orgId, {
    category: category ?? undefined,
    search: search ?? undefined,
  });

  return NextResponse.json(icons);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateIconSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const sanitisedSvg = sanitiseSvg(parsed.data.svg);

  const icon = await createIcon({
    orgId,
    name: parsed.data.name,
    svg: sanitisedSvg,
    viewbox: parsed.data.viewbox,
    category: parsed.data.category,
    tags: parsed.data.tags,
    sizes: parsed.data.sizes,
    strokeWidth: parsed.data.strokeWidth,
    source: parsed.data.source,
    libraryName: parsed.data.libraryName,
  });

  if (!icon) {
    return NextResponse.json(
      { error: "Failed to create icon" },
      { status: 500 }
    );
  }

  return NextResponse.json(icon, { status: 201 });
}
