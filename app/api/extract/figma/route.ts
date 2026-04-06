import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { FigmaClient } from "@/lib/figma/client";
import { extractFromFigma } from "@/lib/figma/extractor";
import { extractLimiter, checkUserRateLimit, rateLimitResponse } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";
import { auth } from "@/lib/auth";
import { registerStream, deregisterStream, isShuttingDown } from "@/lib/server/active-streams";
import { logApiCall } from "@/lib/logging/api-log";
import { logEvent } from "@/lib/logging/platform-event";

const RequestSchema = z.object({
  figmaUrl: z.string().url(),
  accessToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = await getClientIp();
  const { success } = extractLimiter.check(10, ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  const { success: allowed, reset } = checkUserRateLimit(session.user.id);
  if (!allowed) {
    return rateLimitResponse(reset);
  }

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

  if (isShuttingDown()) {
    return NextResponse.json(
      { error: "Server is restarting. Please retry in a few seconds." },
      { status: 503, headers: { "Retry-After": "10" } }
    );
  }

  const { figmaUrl, accessToken } = parsed.data;
  const fileKey = FigmaClient.extractFileKey(figmaUrl);

  if (!fileKey) {
    return Response.json(
      { error: "Invalid Figma URL. Expected figma.com/file/... or figma.com/design/..." },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const streamController = registerStream();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Heartbeat keeps SSE connection alive during long extractions
      const heartbeat = setInterval(() => {
        send({ type: "step", step: "extracting", percent: 0, detail: "Still working..." });
      }, 15_000);

      try {
        const result = await extractFromFigma({
          fileKey,
          accessToken,
          onProgress: (step, percent, detail) => {
            send({ type: "step", step, percent, detail });
          },
        });

        const durationMs = Date.now() - startTime;
        void logApiCall({ userId: session.user.id, endpoint: "extract/figma", statusCode: 200, durationMs, metadata: { figmaFileKey: fileKey } });
        void logEvent("extraction.complete", "studio", { userId: session.user.id, metadata: { sourceType: "figma", durationMs } });

        try {
          send({ type: "complete", data: result });
        } catch (sendErr) {
          if (sendErr instanceof Error && sendErr.message.includes("string longer than")) {
            // Extraction result too large for single SSE message — trim heavy fields
            const trimmed = {
              ...result,
              cssVariables: Object.fromEntries(
                Object.entries(result.cssVariables).slice(0, 500)
              ),
              computedStyles: {},
            };
            send({ type: "complete", data: trimmed });
          } else {
            throw sendErr;
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        void logApiCall({ userId: session.user.id, endpoint: "extract/figma", statusCode: 500, durationMs: Date.now() - startTime, errorMessage: message, metadata: { figmaFileKey: fileKey } });
        void logEvent("extraction.failed", "studio", { userId: session.user.id, metadata: { sourceType: "figma", error: message } });
        send({ type: "error", message });
      } finally {
        clearInterval(heartbeat);
        deregisterStream(streamController);
        controller.close();
      }
    },
    cancel() {
      deregisterStream(streamController);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
