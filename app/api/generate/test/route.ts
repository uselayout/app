import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { createTestStream } from "@/lib/claude/test";

const RequestSchema = z.object({
  prompt: z.string().min(1),
  designMd: z.string().optional(),
  includeContext: z.boolean(),
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

  const { prompt, designMd, includeContext } = parsed.data;
  const stream = createTestStream(prompt, designMd ?? null, includeContext);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
