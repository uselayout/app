import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { analyseCompleteness } from "@/lib/health/completeness";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const BodySchema = z.object({
  layoutMd: z.string().min(1),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  // Try session auth first (Studio UI), then API key auth (Figma plugin / CLI)
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    const apiAuth = await requireMcpAuth(request, "read");
    if (apiAuth instanceof NextResponse) {
      return new NextResponse(apiAuth.body, {
        status: apiAuth.status,
        headers: { ...Object.fromEntries(apiAuth.headers.entries()), ...CORS },
      });
    }
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = analyseCompleteness(parsed.data.layoutMd);
  return NextResponse.json(report, { headers: CORS });
}
