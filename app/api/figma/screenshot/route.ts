import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { importFigmaNode, formatAsContext } from "@/lib/figma/import";
import { resizeScreenshot } from "@/lib/util/resize-screenshot";

const RequestSchema = z.object({
  fileKey: z.string().min(1),
  nodeId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const pat = request.headers.get("X-Figma-Token");
  if (!pat) {
    return Response.json({ error: "Figma token required (X-Figma-Token header)" }, { status: 400 });
  }

  const { fileKey, nodeId } = parsed.data;

  try {
    const imported = await importFigmaNode(fileKey, nodeId, pat);

    if (!imported.screenshotUrl) {
      return Response.json({ error: "Failed to capture screenshot for this node" }, { status: 422 });
    }

    const imageDataUrl = await resizeScreenshot(imported.screenshotUrl);
    if (!imageDataUrl) {
      return Response.json({ error: "Failed to process screenshot" }, { status: 422 });
    }

    const context = formatAsContext(imported);

    return Response.json({
      imageDataUrl,
      context,
      frameName: imported.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}
