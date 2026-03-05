import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { extractFromWebsite } from "@/lib/website/extractor";
import { validateExtractionUrl, SsrfError } from "@/lib/website/validate-url";

const RequestSchema = z.object({
  url: z.url(),
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

  const { url } = parsed.data;

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
