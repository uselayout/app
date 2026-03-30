import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import rateLimit from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";

// 20 requests per minute for auth endpoints (prevents brute-force)
const authLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

const handler = toNextJsHandler(auth);

async function withRateLimit(
  req: NextRequest,
  method: (req: NextRequest) => Promise<Response>,
): Promise<Response> {
  const ip = await getClientIp();
  const { success } = authLimiter.check(20, ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return method(req);
}

export function GET(req: NextRequest) {
  return withRateLimit(req, handler.GET);
}

export function POST(req: NextRequest) {
  return withRateLimit(req, handler.POST);
}
