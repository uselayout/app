import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getFigmaConnection } from "@/lib/supabase/figma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Check whether Figma is connected for the authenticated org.
 */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request);
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const connection = await getFigmaConnection(auth.orgId);
  if (!connection) {
    return NextResponse.json(
      { connected: false },
      { headers: CORS },
    );
  }

  return NextResponse.json(
    {
      connected: true,
      figmaUserName: connection.figmaUserName,
      figmaUserId: connection.figmaUserId,
    },
    { headers: CORS },
  );
}

/**
 * Disconnect Figma (delete the stored connection).
 */
export async function DELETE(request: Request) {
  const auth = await requireMcpAuth(request, "write");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const { deleteFigmaConnection } = await import("@/lib/supabase/figma");
  await deleteFigmaConnection(auth.orgId);

  return NextResponse.json({ disconnected: true }, { headers: CORS });
}
