import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getValidFigmaToken } from "@/lib/supabase/figma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Polls the Figma MCP for capture status.
 * The extension calls this after injecting capture.js.
 */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request);
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const url = new URL(request.url);
  const captureId = url.searchParams.get("captureId");
  const sessionId = url.searchParams.get("sessionId");

  if (!captureId) {
    return NextResponse.json(
      { error: "Missing captureId parameter" },
      { status: 400, headers: CORS },
    );
  }

  let figmaToken: string;
  try {
    figmaToken = await getValidFigmaToken(auth.orgId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Figma not connected";
    return NextResponse.json({ error: msg }, { status: 401, headers: CORS });
  }

  // Poll via Figma MCP — call generate_figma_design with just the captureId
  const toolResponse = await fetch("https://mcp.figma.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${figmaToken}`,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "generate_figma_design",
        arguments: {
          captureId,
        },
      },
    }),
  });

  if (!toolResponse.ok) {
    const text = await toolResponse.text();
    console.error("[Layout] Figma MCP status poll failed:", text);
    return NextResponse.json(
      { error: "Failed to poll capture status" },
      { status: 502, headers: CORS },
    );
  }

  const toolResult = await toolResponse.json();
  if (toolResult.error) {
    return NextResponse.json(
      { error: `Figma MCP error: ${toolResult.error.message}` },
      { status: 502, headers: CORS },
    );
  }

  // Extract status from response
  const content = toolResult.result?.content;
  const textContent = Array.isArray(content)
    ? content
        .filter((c: { type: string }) => c.type === "text")
        .map((c: { text: string }) => c.text)
        .join("\n")
    : "";

  // Try to determine status from the response text
  const isCompleted =
    textContent.toLowerCase().includes("completed") ||
    textContent.toLowerCase().includes("success");
  const isFailed =
    textContent.toLowerCase().includes("failed") ||
    textContent.toLowerCase().includes("error");

  return NextResponse.json(
    {
      status: isCompleted ? "completed" : isFailed ? "failed" : "pending",
      raw: textContent,
    },
    { headers: CORS },
  );
}
