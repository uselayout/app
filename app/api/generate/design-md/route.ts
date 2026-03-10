import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { createDesignMdStream } from "@/lib/claude/synthesise";
import { resizeScreenshot } from "@/lib/util/resize-screenshot";
import type { ExtractionResult } from "@/lib/types";

// Allow large request bodies for screenshot data (base64 images can be 2-5MB each)
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  extractionData: z.object({
    sourceType: z.string(),
    sourceName: z.string(),
    tokens: z.object({
      colors: z.array(z.record(z.string(), z.unknown())),
      typography: z.array(z.record(z.string(), z.unknown())),
      spacing: z.array(z.record(z.string(), z.unknown())),
      radius: z.array(z.record(z.string(), z.unknown())),
      effects: z.array(z.record(z.string(), z.unknown())),
    }),
    components: z.array(z.record(z.string(), z.unknown())),
    screenshots: z.array(z.string()),
    fonts: z.array(z.record(z.string(), z.unknown())),
    animations: z.array(z.record(z.string(), z.unknown())),
    librariesDetected: z.record(z.string(), z.boolean()),
    cssVariables: z.record(z.string(), z.string()),
    computedStyles: z.record(z.string(), z.unknown()),
  }),
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
      { error: "Missing or invalid extractionData", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const apiKey = request.headers.get("X-Api-Key") || undefined;
  if (!apiKey) {
    return Response.json(
      { error: "No API key provided. Add your Anthropic API key in Settings." },
      { status: 401 }
    );
  }

  const extractionData = parsed.data.extractionData as unknown as ExtractionResult;

  // Resize screenshots server-side to keep Claude token costs reasonable
  if (extractionData.screenshots.length > 0) {
    const resized = await Promise.all(
      extractionData.screenshots.map((s) => resizeScreenshot(s))
    );
    extractionData.screenshots = resized.filter(
      (s): s is string => s !== null
    );
  }

  const stream = createDesignMdStream(extractionData, apiKey);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
