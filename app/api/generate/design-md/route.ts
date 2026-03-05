import { NextRequest } from "next/server";
import { createDesignMdStream } from "@/lib/claude/synthesise";
import type { ExtractionResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const extractionData = body.extractionData as ExtractionResult;

  if (!extractionData || !extractionData.sourceType) {
    return Response.json(
      { error: "Missing or invalid extractionData" },
      { status: 400 }
    );
  }

  const stream = createDesignMdStream(extractionData);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
