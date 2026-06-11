import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/logging/platform-event";

// Public download endpoint for Layout Live (the macOS app). Logs a
// `live.download` platform event (so the admin dashboard can count downloads
// by arch) and 302-redirects to the notarised DMG on the update host. The
// actual binary stays on updates.layout.design; this route is just the
// instrumented entry point the /live page links to.
const HOST = "https://updates.layout.design/live";

export async function GET(request: NextRequest) {
  const archParam = request.nextUrl.searchParams.get("arch");
  const arch = archParam === "x64" ? "x64" : "arm64"; // default Apple Silicon

  // Fire-and-forget; never block or fail the download on a logging error.
  void logEvent("live.download", "live", { metadata: { arch } });

  return NextResponse.redirect(`${HOST}/layout-live-${arch}.dmg`, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
