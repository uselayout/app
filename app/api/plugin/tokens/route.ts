// app/api/plugin/tokens/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getTokensByOrg, bulkUpsertTokens } from "@/lib/supabase/tokens";
import { fetchAllProjects } from "@/lib/supabase/db";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "read");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  try {
    const tokens = await getTokensByOrg(auth.orgId);

    const byType: Record<string, Array<{ name: string; value: string; cssVariable: string | null }>> = {};
    for (const t of tokens) {
      if (!byType[t.type]) byType[t.type] = [];
      byType[t.type].push({ name: t.name, value: t.value, cssVariable: t.cssVariable });
    }

    return NextResponse.json({ tokens: byType }, { headers: CORS });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}

const TokenEntrySchema = z.object({
  name: z.string(),
  value: z.string(),
  cssVariable: z.string().nullable().optional(),
});

const DesignTokenTypeSchema = z.enum(["color", "typography", "spacing", "radius", "effect", "motion"]);

const ImportSchema = z.object({
  tokens: z.record(DesignTokenTypeSchema, z.array(TokenEntrySchema)),
});

export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "write");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: CORS }
    );
  }

  const projects = await fetchAllProjects(auth.orgId);
  if (!projects.length) {
    return NextResponse.json({ error: "No projects found for this organisation" }, { status: 404, headers: CORS });
  }

  const tokenData = parsed.data.tokens;
  const rows: Parameters<typeof bulkUpsertTokens>[2] = [];
  for (const key of Object.keys(tokenData) as Array<keyof typeof tokenData>) {
    const entries = tokenData[key];
    for (const entry of entries) {
      rows.push({
        name: entry.name,
        value: entry.value,
        type: key,
        cssVariable: entry.cssVariable ?? undefined,
        source: "figma-variable",
        groupName: key,
      });
    }
  }

  try {
    const result = await bulkUpsertTokens(auth.orgId, projects[0].id, rows);
    return NextResponse.json(
      { created: result.created, updated: result.updated, unchanged: result.unchanged, conflicts: result.conflicts },
      { headers: CORS }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}
