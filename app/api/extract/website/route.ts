import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { extractFromWebsite } from "@/lib/website/extractor";
import { validateExtractionUrl, SsrfError } from "@/lib/website/validate-url";
import { uploadScreenshots } from "@/lib/supabase/storage";

const RequestSchema = z.object({
  url: z.url(),
  projectId: z.string().optional(),
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

  const { url, projectId } = parsed.data;

  try {
    await validateExtractionUrl(url);
  } catch (err) {
    if (err instanceof SsrfError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    return Response.json({ error: "URL validation failed" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const result = await extractFromWebsite({
          url,
          onProgress: (step, percent, detail) => {
            send({ type: "step", step, percent, detail });
          },
        });

        // Upload screenshots to Supabase Storage, replace base64 with URLs
        if (projectId && result.screenshots.length > 0) {
          send({ type: "step", step: "upload", percent: 85, detail: "Uploading screenshots..." });
          const urls = await uploadScreenshots(projectId, result.screenshots);
          if (urls.length > 0) {
            result.screenshots = urls;
          }
        }

        send({ type: "complete", data: result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
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
