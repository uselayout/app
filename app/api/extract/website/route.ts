import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { extractFromWebsite } from "@/lib/website/extractor";
import { validateExtractionUrl, SsrfError } from "@/lib/website/validate-url";
import { uploadScreenshots } from "@/lib/supabase/storage";
import { extractLimiter, checkUserRateLimit, rateLimitResponse } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";
import { auth } from "@/lib/auth";
import { playwrightLimit } from "@/lib/concurrency";
import { registerStream, deregisterStream, isShuttingDown } from "@/lib/server/active-streams";
import { logApiCall } from "@/lib/logging/api-log";
import { logEvent } from "@/lib/logging/platform-event";
import { sendResultChunked } from "@/lib/extraction/chunked-send";

const RequestSchema = z.object({
  url: z.url(),
  projectId: z.string().optional(),
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

  const { url, projectId } = parsed.data;

  try {
    await validateExtractionUrl(url); // Throws SsrfError for private/internal IPs
  } catch (err) {
    if (err instanceof SsrfError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    return Response.json({ error: "URL validation failed" }, { status: 400 });
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

      // Heartbeat keeps the SSE connection alive while queued
      const heartbeat = setInterval(() => {
        send({ type: "step", step: "queued", percent: 0, detail: "Waiting for available slot..." });
      }, 15_000);

      try {
        const result = await playwrightLimit(async () => {
          clearInterval(heartbeat);

          return extractFromWebsite({
            url,
            onProgress: (step, percent, detail) => {
              send({ type: "step", step, percent, detail });
            },
          });
        });

        // Upload screenshots to Supabase Storage, replace base64 with URLs
        if (projectId && result.screenshots.length > 0) {
          send({ type: "step", step: "upload", percent: 85, detail: "Uploading screenshots..." });
          const urls = await uploadScreenshots(projectId, result.screenshots);
          if (urls.length > 0) {
            result.screenshots = urls;
          }
        }

        const durationMs = Date.now() - startTime;
        void logApiCall({ userId: session.user.id, endpoint: "extract/website", statusCode: 200, durationMs, metadata: { domain: new URL(url).hostname, projectId } });
        void logEvent("extraction.complete", "studio", { userId: session.user.id, metadata: { sourceType: "website", domain: new URL(url).hostname, screenshotCount: result.screenshots.length, durationMs } });

        try {
          send({ type: "complete", data: result });
        } catch (sendErr) {
          if (sendErr instanceof Error && sendErr.message.includes("string longer than")) {
            sendResultChunked(send, result);
          } else {
            throw sendErr;
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        void logApiCall({ userId: session.user.id, endpoint: "extract/website", statusCode: 500, durationMs: Date.now() - startTime, errorMessage: message, metadata: { domain: new URL(url).hostname } });
        void logEvent("extraction.failed", "studio", { userId: session.user.id, metadata: { sourceType: "website", error: message } });
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
