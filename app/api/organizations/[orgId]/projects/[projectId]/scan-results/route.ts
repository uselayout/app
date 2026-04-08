import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { supabase } from "@/lib/supabase/client";

/**
 * Scan Results API
 *
 * Receives component scan results from the CLI (`layout scan`) or GitHub
 * scanner and stores them on the project. Also performs lightweight matching
 * against Figma-extracted components when extraction data is available.
 *
 * DB migration required: add columns to layout_projects:
 *   scanned_components  jsonb
 *   scan_source         text
 *   last_scan_at        timestamptz
 *   github_repo         text
 */

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

type Params = { params: Promise<{ orgId: string; projectId: string }> };

const ScannedComponentSchema = z.object({
  name: z.string(),
  filePath: z.string(),
  exportType: z.enum(["default", "named"]),
  propsType: z.string().optional(),
  props: z.array(z.string()),
  usesForwardRef: z.boolean(),
  importPath: z.string(),
  source: z.enum(["storybook", "codebase"]),
  stories: z.array(z.string()).optional(),
  args: z
    .array(
      z.object({
        name: z.string(),
        type: z.string().optional(),
        defaultValue: z.string().optional(),
        options: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

const RequestSchema = z.object({
  components: z.array(ScannedComponentSchema),
  source: z.enum(["cli", "github"]).default("cli"),
  githubRepo: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST - Store scan results
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { orgId, projectId } = await params;

    // Accept either session auth or API key auth (CLI uses API keys)
    const hasBearer = request.headers.get("Authorization")?.startsWith("Bearer ");
    let authedOrgId: string;

    if (hasBearer) {
      const mcpAuth = await requireMcpAuth(request, "write");
      if (mcpAuth instanceof NextResponse) return mcpAuth;
      authedOrgId = mcpAuth.orgId;
    } else {
      const authResult = await requireOrgAuth(orgId, "editProject");
      if (authResult instanceof NextResponse) return authResult;
      authedOrgId = authResult.orgId;
    }
    // Use the resolved org ID for DB queries (slug → UUID)
    const resolvedOrgId = authedOrgId;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { components, source, githubRepo } = parsed.data;

    // Fetch extraction data to match scanned components against Figma components
    const { data: project } = await supabase
      .from("layout_projects")
      .select("extraction_data")
      .eq("id", projectId)
      .eq("org_id", resolvedOrgId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const extractionData = project.extraction_data as
      | Record<string, unknown>
      | null
      | undefined;
    const extractedComponents = (extractionData?.components ?? []) as Array<{
      name: string;
    }>;
    // Normalise names for matching: lowercase, remove hyphens/spaces/slashes
    function normaliseName(name: string): string {
      return name.toLowerCase().replace(/[/\-\s]+/g, "");
    }

    const figmaNormalised = extractedComponents.map((c) => ({
      original: c.name,
      normalised: normaliseName(c.name),
    }));

    // Match scanned components against extracted (Figma) components
    const matched = components.map((c) => {
      const codeNorm = normaliseName(c.name);

      // Priority 1: Exact normalised match
      const exact = figmaNormalised.find((f) => f.normalised === codeNorm);
      if (exact) {
        return { ...c, designSystemMatch: exact.original, matchConfidence: 1.0 };
      }

      // Priority 2: One starts with the other (min 4 chars to prevent "tab" matching "table")
      const startsWith = figmaNormalised.find((f) => {
        const shorter = f.normalised.length < codeNorm.length ? f.normalised : codeNorm;
        const longer = f.normalised.length < codeNorm.length ? codeNorm : f.normalised;
        return shorter.length >= 4 && longer.startsWith(shorter);
      });
      if (startsWith) {
        return { ...c, designSystemMatch: startsWith.original, matchConfidence: 0.7 };
      }

      return { ...c, designSystemMatch: undefined, matchConfidence: undefined };
    });

    // Store on project
    // NOTE: columns scanned_components, scan_source, last_scan_at, github_repo
    // may not exist yet. Supabase will return an error for unknown columns.
    // A migration is needed to add them to layout_projects.
    const { error } = await supabase
      .from("layout_projects")
      .update({
        scanned_components: matched,
        scan_source: source,
        last_scan_at: new Date().toISOString(),
        ...(githubRepo ? { github_repo: githubRepo } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("org_id", resolvedOrgId);

    if (error) {
      console.error("[scan-results] Failed to store:", error.message);
      return NextResponse.json(
        { error: "Failed to store scan results" },
        { status: 500 }
      );
    }

    const matchCount = matched.filter((c) => c.designSystemMatch).length;
    return NextResponse.json({
      stored: matched.length,
      matched: matchCount,
      unmatched: matched.length - matchCount,
    });
  } catch (err) {
    console.error("POST scan-results error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET - Retrieve scan results
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { orgId, projectId } = await params;

    const hasBearer = _request.headers.get("Authorization")?.startsWith("Bearer ");
    let getOrgId: string;

    if (hasBearer) {
      const mcpAuth = await requireMcpAuth(_request, "read");
      if (mcpAuth instanceof NextResponse) return mcpAuth;
      getOrgId = mcpAuth.orgId;
    } else {
      const authResult = await requireOrgAuth(orgId, "viewProject");
      if (authResult instanceof NextResponse) return authResult;
      getOrgId = authResult.orgId;
    }

    const { data, error } = await supabase
      .from("layout_projects")
      .select("scanned_components, scan_source, last_scan_at, github_repo")
      .eq("id", projectId)
      .eq("org_id", getOrgId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      components: (data.scanned_components as unknown[]) ?? [],
      source: data.scan_source as string | null,
      lastScanAt: data.last_scan_at as string | null,
      githubRepo: data.github_repo as string | null,
    });
  } catch (err) {
    console.error("GET scan-results error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
