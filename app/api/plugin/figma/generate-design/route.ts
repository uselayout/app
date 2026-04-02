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
  tool: z.enum(["generate_figma_design", "use_figma"]).optional(),
  description: z.string().optional(),
});

/**
 * Calls Figma MCP to create designs in Figma.
 *
 * Supports two tools:
 * - `generate_figma_design` (default): Creates a capture session, returns captureId for capture.js injection.
 * - `use_figma`: Creates native, editable Figma objects directly. Returns the tool result text.
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

  const selectedTool = parsed.data.tool ?? "generate_figma_design";

  // Step 3: Call the selected Figma MCP tool
  const toolArgs =
    selectedTool === "use_figma"
      ? {
          ...(parsed.data.description ? { description: parsed.data.description } : {}),
          fileKey: parsed.data.fileKey,
        }
      : {
          outputMode: "existingFile" as const,
          fileKey: parsed.data.fileKey,
          ...(parsed.data.pageName ? { pageName: parsed.data.pageName } : {}),
        };

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
        name: selectedTool,
        arguments: toolArgs,
      },
    }),
  });

  if (!toolResponse.ok) {
    const text = await toolResponse.text();
    console.error(`[Layout] Figma MCP ${selectedTool} failed:`, text);
    return NextResponse.json(
      { error: `Failed to call ${selectedTool}` },
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

  // Extract content from the tool result
  const content = toolResult.result?.content;
  if (!content || !Array.isArray(content)) {
    return NextResponse.json(
      { error: "Unexpected response from Figma MCP" },
      { status: 502, headers: CORS },
    );
  }

  const textContent = content
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("\n");

  // For use_figma: return the result text directly (no captureId flow)
  if (selectedTool === "use_figma") {
    return NextResponse.json(
      {
        tool: "use_figma",
        result: textContent,
        sessionId,
      },
      { headers: CORS },
    );
  }

  // For generate_figma_design: extract captureId from response
  const captureIdMatch = textContent.match(/captureId["\s:]+([a-zA-Z0-9_-]+)/i);
  if (!captureIdMatch?.[1]) {
    try {
      const jsonParsed = JSON.parse(textContent);
      if (jsonParsed.captureId) {
        return NextResponse.json(
          {
            captureId: jsonParsed.captureId,
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
