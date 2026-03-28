import { NextResponse } from "next/server";
import { isShuttingDown } from "@/lib/server/active-streams";

/**
 * Readiness probe. Returns 503 during graceful shutdown so the load
 * balancer stops routing new requests to this instance.
 */
export async function GET() {
  if (isShuttingDown()) {
    return NextResponse.json(
      { status: "draining" },
      { status: 503, headers: { "Retry-After": "10" } }
    );
  }

  return NextResponse.json({ status: "ready" });
}
