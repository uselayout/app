import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { generateImage } from "@/lib/image/generate";
import { processImagePlaceholders } from "@/lib/image/pipeline";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const SingleImageSchema = z.object({
  mode: z.literal("single").default("single"),
  prompt: z.string().min(1),
  style: z.enum(["photo", "illustration", "icon", "abstract"]).optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "21:9"]).optional(),
  resolution: z.enum(["512", "1K", "2K"]).optional(),
  brandColours: z.array(z.string()).optional(),
  brandStyle: z.string().optional(),
  orgId: z.string().optional(),
});

const BatchSchema = z.object({
  mode: z.literal("batch"),
  html: z.string().min(1),
  orgId: z.string().optional(),
  brandColours: z.array(z.string()).optional(),
  brandStyle: z.string().optional(),
});

const RequestSchema = z.discriminatedUnion("mode", [
  SingleImageSchema,
  BatchSchema,
]);

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Auth check
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.mode === "batch") {
      // Batch mode: process all image placeholders in HTML
      const { html, orgId, brandColours, brandStyle } = parsed.data;

      const processedHtml = await processImagePlaceholders(html, {
        orgId,
        brandColours,
        brandStyle,
      });

      return NextResponse.json({ html: processedHtml });
    }

    // Single image mode
    const { prompt, style, aspectRatio, resolution, brandColours, brandStyle, orgId } =
      parsed.data;

    const result = await generateImage({
      prompt,
      style,
      aspectRatio,
      resolution,
      brandColours,
      brandStyle,
      orgId,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate/image] Error:", err);

    const message =
      err instanceof Error ? err.message : "Image generation failed";

    // Check for missing API key
    if (message.includes("GOOGLE_AI_API_KEY")) {
      return NextResponse.json(
        { error: "Image generation is not configured. Contact your administrator." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
