import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import type { McpAuthResult } from "@/lib/api/mcp-auth";
import { getComponentBySlug, getComponentsByOrg } from "@/lib/supabase/components";
import { generateTokensCss } from "@/lib/export/tokens-css";
import { generateTokensJson } from "@/lib/export/tokens-json";
import { supabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/supabase/analytics";
import type { ExtractionResult } from "@/lib/types";

// ─── Schema ──────────────────────────────────────────────────────────────────

const McpRequestSchema = z.object({
  tool: z.enum([
    "get_design_system",
    "get_tokens",
    "get_component",
    "list_components",
    "check_compliance",
  ]),
  params: z.record(z.string(), z.unknown()).optional().default({}),
});

// ─── Tool Handlers ───────────────────────────────────────────────────────────

async function handleGetDesignSystem(
  orgId: string,
  params: Record<string, unknown>
) {
  const projectId = typeof params.projectId === "string" ? params.projectId : null;

  if (projectId) {
    const { data, error } = await supabase
      .from("layout_projects")
      .select("id, name, design_md")
      .eq("id", projectId)
      .eq("org_id", orgId)
      .single();

    if (error || !data) {
      return { error: "Project not found or does not belong to this organisation" };
    }

    return {
      result: {
        designMd: data.design_md as string,
        projectName: data.name as string,
        projectId: data.id as string,
      },
    };
  }

  const { data, error } = await supabase
    .from("layout_projects")
    .select("id, name, design_md")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { error: "No projects found for this organisation" };
  }

  return {
    result: {
      designMd: data.design_md as string,
      projectName: data.name as string,
      projectId: data.id as string,
    },
  };
}

async function handleGetTokens(
  orgId: string,
  params: Record<string, unknown>
) {
  const format = params.format === "json" ? "json" : "css";

  const { data, error } = await supabase
    .from("layout_projects")
    .select("id, name, extraction_data")
    .eq("org_id", orgId)
    .not("extraction_data", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { error: "No project with extraction data found" };
  }

  const extraction = data.extraction_data as ExtractionResult;
  if (!extraction?.tokens) {
    return { error: "Extraction data does not contain tokens" };
  }

  const tokens =
    format === "json"
      ? generateTokensJson(extraction.tokens)
      : generateTokensCss(extraction.tokens);

  return {
    result: {
      tokens,
      format,
      projectName: data.name as string,
    },
  };
}

async function handleGetComponent(
  orgId: string,
  params: Record<string, unknown>
) {
  const slug = typeof params.slug === "string" ? params.slug : null;
  if (!slug) {
    return { error: "Missing required parameter: slug" };
  }

  const component = await getComponentBySlug(orgId, slug);
  if (!component || component.status !== "approved") {
    return { error: `Component "${slug}" not found or not approved` };
  }

  return {
    result: {
      name: component.name,
      slug: component.slug,
      description: component.description,
      category: component.category,
      code: component.code,
      props: component.props,
      variants: component.variants,
      states: component.states,
      version: component.version,
    },
  };
}

async function handleListComponents(
  orgId: string,
  params: Record<string, unknown>
) {
  const category = typeof params.category === "string" ? params.category : undefined;

  const components = await getComponentsByOrg(orgId, {
    status: "approved",
    category,
  });

  return {
    result: {
      components: components.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        category: c.category,
        version: c.version,
      })),
    },
  };
}

async function handleCheckCompliance(
  orgId: string,
  params: Record<string, unknown>
) {
  const code = typeof params.code === "string" ? params.code : null;
  if (!code) {
    return { error: "Missing required parameter: code" };
  }

  const issues: Array<{ rule: string; message: string; severity: "error" | "warning" }> = [];

  // Check for hardcoded hex colours (not inside var() calls)
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
  let match: RegExpExecArray | null;
  while ((match = hexPattern.exec(code)) !== null) {
    // Check if this hex is inside a var() call
    const before = code.slice(Math.max(0, match.index - 30), match.index);
    if (!before.includes("var(")) {
      issues.push({
        rule: "no-hardcoded-colours",
        message: `Hardcoded colour "${match[0]}" — use a design token instead`,
        severity: "error",
      });
    }
  }

  // Check for inline styles
  if (/\bstyle\s*=\s*\{/g.test(code)) {
    issues.push({
      rule: "no-inline-styles",
      message: "Inline styles detected — prefer CSS classes or token-based utilities",
      severity: "warning",
    });
  }

  // Check for !important
  if (/!important/g.test(code)) {
    issues.push({
      rule: "no-important",
      message: "!important usage detected — avoid overriding styles this way",
      severity: "warning",
    });
  }

  // Extract var() references and compare against known tokens
  const varPattern = /var\(--([^)]+)\)/g;
  const usedVars: string[] = [];
  let varMatch: RegExpExecArray | null;
  while ((varMatch = varPattern.exec(code)) !== null) {
    usedVars.push(`--${varMatch[1]}`);
  }

  if (usedVars.length > 0) {
    // Fetch approved components to build a set of known token names
    const components = await getComponentsByOrg(orgId, { status: "approved" });
    const knownTokens = new Set<string>();
    for (const comp of components) {
      for (const token of comp.tokensUsed) {
        knownTokens.add(token);
      }
    }

    // Also fetch project tokens if available
    const { data: projectData } = await supabase
      .from("layout_projects")
      .select("extraction_data")
      .eq("org_id", orgId)
      .not("extraction_data", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (projectData?.extraction_data) {
      const extraction = projectData.extraction_data as ExtractionResult;
      if (extraction.tokens) {
        const allTokens = [
          ...extraction.tokens.colors,
          ...extraction.tokens.typography,
          ...extraction.tokens.spacing,
          ...extraction.tokens.radius,
          ...extraction.tokens.effects,
        ];
        for (const token of allTokens) {
          if (token.cssVariable) {
            knownTokens.add(token.cssVariable);
          }
        }
      }
      if (extraction.cssVariables) {
        for (const varName of Object.keys(extraction.cssVariables)) {
          knownTokens.add(varName);
        }
      }
    }

    // Only flag unknown vars if we have known tokens to compare against
    if (knownTokens.size > 0) {
      for (const varName of usedVars) {
        if (!knownTokens.has(varName)) {
          issues.push({
            rule: "unknown-token",
            message: `Unknown CSS variable "${varName}" — not found in design system`,
            severity: "warning",
          });
        }
      }
    }
  }

  return {
    result: {
      compliant: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    },
  };
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const authResult = await requireMcpAuth(request, "read");
  if (authResult instanceof NextResponse) return authResult;

  const { orgId } = authResult as McpAuthResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = McpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tool, params } = parsed.data;

  type ToolResult = { result?: unknown; error?: string };
  let toolResult: ToolResult;

  switch (tool) {
    case "get_design_system":
      toolResult = await handleGetDesignSystem(orgId, params);
      break;
    case "get_tokens":
      toolResult = await handleGetTokens(orgId, params);
      break;
    case "get_component":
      toolResult = await handleGetComponent(orgId, params);
      break;
    case "list_components":
      toolResult = await handleListComponents(orgId, params);
      break;
    case "check_compliance":
      toolResult = await handleCheckCompliance(orgId, params);
      break;
  }

  if (toolResult.error) {
    return NextResponse.json(
      { tool, error: toolResult.error },
      { status: 404 }
    );
  }

  // Fire-and-forget analytics tracking
  void trackEvent({
    orgId,
    eventType: "mcp.tool_call",
    eventData: { tool },
    apiKeyId: (authResult as McpAuthResult).keyId,
  });

  return NextResponse.json({ tool, result: toolResult.result });
}
