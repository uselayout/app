import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  listLayoutMdVersions,
  saveLayoutMdVersion,
} from "@/lib/supabase/layout-md-versions";

type RouteContext = {
  params: Promise<{ orgId: string; projectId: string }>;
};

export async function GET(_request: Request, ctx: RouteContext) {
  const { orgId, projectId } = await ctx.params;

  const auth = await requireOrgAuth(orgId, "viewProject");
  if (auth instanceof NextResponse) return auth;

  const versions = await listLayoutMdVersions(projectId, orgId);
  return NextResponse.json({ versions });
}

const SaveVersionSchema = z.object({
  layoutMd: z.string().min(1),
  source: z.enum(["manual", "generation", "extraction"]),
});

export async function POST(request: Request, ctx: RouteContext) {
  const { orgId, projectId } = await ctx.params;

  const auth = await requireOrgAuth(orgId, "editProject");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SaveVersionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await saveLayoutMdVersion(
    projectId,
    orgId,
    parsed.data.layoutMd,
    parsed.data.source,
    auth.userId,
  );

  return NextResponse.json({ ok: true });
}
