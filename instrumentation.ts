/**
 * Next.js instrumentation hook. Runs once on server startup.
 * Registers SIGTERM/SIGINT handlers for graceful shutdown.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startGracefulShutdown, closeAllBrowsers } = await import("@/lib/server/active-streams");

    const shutdown = async (signal: string) => {
      console.log(`[shutdown] Received ${signal}. Starting graceful drain...`);
      await startGracefulShutdown();
      await closeAllBrowsers();
      process.exit(0);
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));

    console.log("[instrumentation] Graceful shutdown handlers registered.");
  }
}
