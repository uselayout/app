import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { scanStorybookComponents, matchComponents } from "@/lib/integrations/storybook";
import { scanProjectComponents, matchCodebaseToDesignSystem } from "@/lib/integrations/codebase-scan";

const RequestSchema = z.object({
  projectDir: z.string().min(1),
  type: z.enum(["storybook", "codebase", "both"]).default("both"),
  designSystemComponents: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { projectDir, type, designSystemComponents } = parsed.data;
  const dsNames = designSystemComponents ?? [];

  try {
    const result: Record<string, unknown> = {};

    if (type === "storybook" || type === "both") {
      const storyComponents = await scanStorybookComponents(projectDir);
      result.storybook = {
        components: storyComponents,
        matches: dsNames.length > 0 ? matchComponents(storyComponents, dsNames) : [],
      };
    }

    if (type === "codebase" || type === "both") {
      const codebaseComponents = await scanProjectComponents(projectDir);
      result.codebase = {
        components: codebaseComponents,
        matches: dsNames.length > 0 ? matchCodebaseToDesignSystem(codebaseComponents, dsNames) : [],
      };
    }

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
