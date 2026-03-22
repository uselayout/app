import { NextResponse } from "next/server";
import rateLimit from "./rate-limit";

// 10 requests per minute for extraction endpoints (IP-based)
export const extractLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

// 20 requests per minute for generation endpoints (IP-based)
export const generateLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

// 60 requests per minute for transpile
export const transpileLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

// 10 requests per minute for invite code validation (prevents brute-force)
export const inviteValidateLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

// 10 requests per hour per user (across extraction + generation routes combined)
export const userHourlyLimiter = rateLimit({ interval: 3_600_000, uniqueTokenPerInterval: 1000 });

const HOURLY_LIMIT = 10;

const WINDOW_MS = 3_600_000;

export function checkUserRateLimit(userId: string): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const { success, remaining, oldestTimestamp } = userHourlyLimiter.check(HOURLY_LIMIT, userId);
  // reset is when the oldest request in the window expires; if no requests yet, one full window from now
  const reset = oldestTimestamp !== null ? oldestTimestamp + WINDOW_MS : now + WINDOW_MS;
  return { success, remaining, reset };
}

export function rateLimitResponse(reset: number): NextResponse {
  const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
  return NextResponse.json(
    { error: "You've hit your hourly limit. Come back in a few minutes.", retryAfter: retryAfterSec },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
