import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { transpileTsx } from "@/lib/transpile";
import { transpileLimiter } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";
import { auth } from "@/lib/auth";

const schema = z.object({ code: z.string().max(200_000) });

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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code } = parsed.data;

  try {
    const js = transpileTsx(code);
    return NextResponse.json({ js });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
