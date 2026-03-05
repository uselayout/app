import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { createDesignMdStream } from "@/lib/claude/synthesise";
import type { ExtractionResult } from "@/lib/types";

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

  const extractionData = parsed.data.extractionData as unknown as ExtractionResult;
  const stream = createDesignMdStream(extractionData);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
