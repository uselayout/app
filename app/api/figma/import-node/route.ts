import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { importFigmaNode } from "@/lib/figma/import";
import { diffFigmaAgainstDesignMd } from "@/lib/figma/diff";

const RequestSchema = z.object({
  fileKey: z.string().min(1),
  nodeId: z.string().min(1),
  designMd: z.string().optional(),
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

  const { fileKey, nodeId, designMd } = parsed.data;

  try {
    const imported = await importFigmaNode(fileKey, nodeId, pat);
    const changes = designMd
      ? diffFigmaAgainstDesignMd(imported, designMd)
      : [];

    return Response.json({
      node: imported,
      changes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
