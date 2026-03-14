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

function sanitiseSvg(svg: string): string {
  // Strip <script> tags
  let clean = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Strip on* event attributes
  clean = clean.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");
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
