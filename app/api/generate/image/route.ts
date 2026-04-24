import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { generateImage } from "@/lib/image/generate";
import { processImagePlaceholders } from "@/lib/image/pipeline";

// Allow up to 2 minutes for large image batches (many Gemini calls)
export const maxDuration = 120;

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
  forceRegenerate: z.boolean().optional(),
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
    const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return NextResponse.json(
      { error: `Invalid request: ${fields}` },
      { status: 400 }
    );
  }

  // BYOK via header, with env var fallback for self-hosted deployments.
  // Either Google (Gemini) or OpenAI (GPT Image 2.0) is sufficient — the
  // router auto-routes text-heavy prompts to OpenAI when both are present.
  const googleApiKey = request.headers.get("X-Google-Api-Key") || process.env.GOOGLE_AI_API_KEY || undefined;
  const openaiApiKey = request.headers.get("X-OpenAI-Api-Key") || process.env.OPENAI_API_KEY || undefined;
  if (!googleApiKey && !openaiApiKey) {
    return NextResponse.json(
      { error: "Image generation requires a Google AI or OpenAI API key. Add one in API Keys settings.", code: "NO_API_KEY" },
      { status: 503 }
    );
  }

  try {
    if (parsed.data.mode === "batch") {
      // Batch mode: process all image placeholders in HTML via SSE stream
      const { html, orgId, brandColours, brandStyle, forceRegenerate } = parsed.data;

      let imageIndex = 0;
      let totalImages = 0;
      const requestSignal = request.signal;
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      const host = request.headers.get("host") ?? "localhost:3000";
      const appOrigin = `${proto}://${host}`;

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          function sendEvent(data: Record<string, unknown>) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            } catch {
              // Controller closed — client disconnected
            }
          }

          try {
            const result = await processImagePlaceholders(html, {
              orgId,
              brandColours,
              brandStyle,
              googleApiKey,
              openaiApiKey,
              forceRegenerate,
              signal: requestSignal,
              onImageComplete: (_index, url) => {
                imageIndex++;
                sendEvent({
                  type: "progress",
                  index: imageIndex,
                  total: totalImages || imageIndex,
                  url,
                });
              },
              onImageError: (_index, error) => {
                imageIndex++;
                sendEvent({
                  type: "error",
                  index: imageIndex,
                  total: totalImages || imageIndex,
                  message: error,
                });
              },
              onTotalCount: (count) => {
                totalImages = count;
              },
            });

            // Convert relative proxy URLs to absolute so they work inside srcdoc iframes.
            // Only match URLs that START with /api/storage/ (after =" or =') to avoid
            // double-prefixing already-absolute URLs from previous generations.
            const absoluteHtml = result.html
              .replaceAll('="/api/storage/', `="${appOrigin}/api/storage/`)
              .replaceAll("='/api/storage/", `='${appOrigin}/api/storage/`);

            sendEvent({
              type: "complete",
              html: absoluteHtml,
              totalCount: result.totalCount,
              failedCount: result.failedCount,
              errors: result.errors,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Image generation failed";
            sendEvent({ type: "error", message });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
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
      googleApiKey,
      openaiApiKey,
    });

    // Convert relative proxy URL to absolute so it works inside srcdoc iframes
    if (result.url.startsWith("/api/storage/")) {
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      const host = request.headers.get("host") ?? "localhost:3000";
      result.url = `${proto}://${host}${result.url}`;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate/image] Error:", err);

    const message =
      err instanceof Error ? err.message : "Image generation failed";

    // Check for missing API key
    if (message.includes("GOOGLE_AI_API_KEY") || message.includes("OPENAI_API_KEY") || message.includes("No image generation API key")) {
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
