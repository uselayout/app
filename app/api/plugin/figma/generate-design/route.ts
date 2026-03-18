import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getValidFigmaToken } from "@/lib/supabase/figma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const GenerateDesignSchema = z.object({
  fileKey: z.string(),
  pageName: z.string().optional(),
});

/**
 * Calls Figma MCP's generate_figma_design tool to create a capture session.
 * Returns a captureId that the extension uses to inject capture.js.
 */
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
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: CORS },
    );
  }

  const parsed = GenerateDesignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
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

  // Call Figma MCP via Streamable HTTP transport
  // Step 1: Initialize MCP session
  const initResponse = await fetch("https://mcp.figma.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${figmaToken}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "layout-studio", version: "1.0.0" },
      },
    }),
  });

  if (!initResponse.ok) {
    const text = await initResponse.text();
    console.error("[Layout] Figma MCP init failed:", initResponse.status, text);
    return NextResponse.json(
      { error: `Figma MCP connection failed (${initResponse.status})` },
      { status: 502, headers: CORS },
    );
  }

  // Extract session ID from response
  const sessionId = initResponse.headers.get("mcp-session-id");
  const initResult = await initResponse.json();
  if (initResult.error) {
    return NextResponse.json(
      { error: `Figma MCP error: ${initResult.error.message}` },
      { status: 502, headers: CORS },
    );
  }

  // Step 2: Send initialized notification
  await fetch("https://mcp.figma.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${figmaToken}`,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }),
  });

  // Step 3: Call generate_figma_design tool
  const toolResponse = await fetch("https://mcp.figma.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${figmaToken}`,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "generate_figma_design",
        arguments: {
          outputMode: "existingFile",
          fileKey: parsed.data.fileKey,
          ...(parsed.data.pageName ? { pageName: parsed.data.pageName } : {}),
        },
      },
    }),
  });

  if (!toolResponse.ok) {
    const text = await toolResponse.text();
    console.error("[Layout] Figma MCP tool call failed:", text);
    return NextResponse.json(
      { error: "Failed to call generate_figma_design" },
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

  // Extract captureId from the tool result
  // The result.content is an array of text blocks; captureId is in the response
  const content = toolResult.result?.content;
  if (!content || !Array.isArray(content)) {
    return NextResponse.json(
      { error: "Unexpected response from Figma MCP" },
      { status: 502, headers: CORS },
    );
  }

  // Parse the text content to find captureId
  const textContent = content
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("\n");

  // captureId is typically returned in the response text
  const captureIdMatch = textContent.match(/captureId["\s:]+([a-zA-Z0-9_-]+)/i);
  if (!captureIdMatch?.[1]) {
    // Try to parse as JSON in case the content is structured
    try {
      const parsed = JSON.parse(textContent);
      if (parsed.captureId) {
        return NextResponse.json(
          {
            captureId: parsed.captureId,
            sessionId,
          },
          { headers: CORS },
        );
      }
    } catch {
      // Not JSON, continue with regex approach
    }

    console.error("[Layout] Could not extract captureId from:", textContent);
    return NextResponse.json(
      { error: "Could not extract captureId from Figma response", raw: textContent },
      { status: 502, headers: CORS },
    );
  }

  return NextResponse.json(
    {
      captureId: captureIdMatch[1],
      sessionId,
    },
    { headers: CORS },
  );
}
