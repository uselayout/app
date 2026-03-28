import { NextResponse } from "next/server";
import { isShuttingDown, activeStreamCount } from "@/lib/server/active-streams";

const startTime = Date.now();

/**
 * Detailed status endpoint for monitoring and rollback verification.
 */
export async function GET() {
  return NextResponse.json({
    status: isShuttingDown() ? "draining" : "ok",
    activeStreams: activeStreamCount(),
    shuttingDown: isShuttingDown(),
    version: process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
}
