import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import {
  createFigmaCapture,
  getPendingFigmaCapture,
} from "@/lib/supabase/figma";
import { logEvent } from "@/lib/logging/platform-event";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * POST — Create a pending Figma capture (push-to-Figma tree payload).
 */
export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "write");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  let body: { tree?: unknown; url?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS },
    );
  }

  if (!body.tree || typeof body.tree !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid 'tree' field — must be a JSON object" },
      { status: 400, headers: CORS },
    );
  }

  const captureId = await createFigmaCapture(
    auth.orgId,
    body.tree,
    body.url ?? null,
    body.title ?? null,
  );

  void logEvent("plugin.figma.capture", "figma-plugin", { orgId: auth.orgId, metadata: { url: body.url } });

  return NextResponse.json({ captureId }, { status: 201, headers: CORS });
}

/**
 * GET — Fetch and consume the latest pending capture for the authenticated org.
 */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request);
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const capture = await getPendingFigmaCapture(auth.orgId);

  return NextResponse.json({ capture }, { headers: CORS });
}
