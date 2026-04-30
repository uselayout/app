import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { transpileTsx, TranspileError } from "@/lib/transpile";
import { transpileLimiter } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";
import { auth } from "@/lib/auth";

const schema = z.object({ code: z.string().max(2_000_000) });

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const ip = await getClientIp();
  const { success } = transpileLimiter.check(60, ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const tooLong = issues.some((i) => i.code === "too_big");
    return NextResponse.json(
      { error: tooLong ? "Code too large to preview (max 2MB)" : "Invalid request" },
      { status: 400 }
    );
  }

  const { code } = parsed.data;

  // Strip base64 data URLs before transpilation to avoid massive string literals.
  // They don't affect TypeScript compilation and are preserved in the output.
  const dataUrlPlaceholders: string[] = [];
  const strippedCode = code.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/g, (match) => {
    dataUrlPlaceholders.push(match);
    return `__DATA_URL_${dataUrlPlaceholders.length - 1}__`;
  });

  try {
    let js = await transpileTsx(strippedCode);
    // Restore base64 data URLs in the transpiled output
    for (let i = 0; i < dataUrlPlaceholders.length; i++) {
      js = js.replace(`__DATA_URL_${i}__`, dataUrlPlaceholders[i]);
    }
    return NextResponse.json({ js });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const position = err instanceof TranspileError ? err.position : null;
    return NextResponse.json(
      position ? { error: message, line: position.line, column: position.column } : { error: message },
      { status: 400 }
    );
  }
}
