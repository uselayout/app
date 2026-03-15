import { NextResponse } from "next/server";
import { z } from "zod";
import { analyseCompleteness } from "@/lib/health/completeness";

const BodySchema = z.object({
  designMd: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = analyseCompleteness(parsed.data.designMd);
  return NextResponse.json(report);
}
