/**
 * Active stream registry for graceful shutdown.
 *
 * Tracks all in-flight streaming operations (SSE, Claude generation, etc.)
 * so the server can wait for them to complete before exiting on SIGTERM.
 */

const activeStreams = new Set<AbortController>();
let shuttingDown = false;

/** Register a stream. Returns an AbortController the route can use for cleanup. */
export function registerStream(): AbortController {
  const controller = new AbortController();
  activeStreams.add(controller);
  return controller;
}

/** Remove a completed stream from the registry. */
export function deregisterStream(controller: AbortController): void {
  activeStreams.delete(controller);
}

/** True when the server is draining and should reject new work. */
export function isShuttingDown(): boolean {
  return shuttingDown;
}

/** Number of currently active streams. */
export function activeStreamCount(): number {
  return activeStreams.size;
}

/**
 * Initiate graceful shutdown. Waits for all active streams to finish,
 * up to a hard timeout. Called from instrumentation.ts on SIGTERM.
 */
export async function startGracefulShutdown(hardTimeoutMs = 130_000): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[shutdown] Draining ${activeStreams.size} active stream(s)...`);

  if (activeStreams.size === 0) {
    console.log("[shutdown] No active streams, exiting immediately.");
    return;
  }

  // Wait for all streams to deregister themselves, or force exit after timeout
  await Promise.race([
    waitForStreamsToComplete(),
    sleep(hardTimeoutMs).then(() => {
      console.warn(`[shutdown] Hard timeout reached (${hardTimeoutMs}ms). Aborting ${activeStreams.size} remaining stream(s).`);
      for (const controller of activeStreams) {
        controller.abort();
      }
    }),
  ]);

  console.log("[shutdown] All streams drained. Exiting.");
}

function waitForStreamsToComplete(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (activeStreams.size === 0) {
        resolve();
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Browser registry for Playwright cleanup on shutdown.
 * Each website extraction registers its browser here so it can be
 * force-closed if the server is shutting down.
 */
interface Closeable {
  close(): Promise<void>;
}

const activeBrowsers = new Set<Closeable>();

export function registerBrowser(browser: Closeable): void {
  activeBrowsers.add(browser);
}

export function deregisterBrowser(browser: Closeable): void {
  activeBrowsers.delete(browser);
}

/** Force-close all active Playwright browsers. Called during shutdown. */
export async function closeAllBrowsers(): Promise<void> {
  const promises = Array.from(activeBrowsers).map((b) =>
    b.close().catch((err) => console.warn("[shutdown] Failed to close browser:", err))
  );
  await Promise.all(promises);
  activeBrowsers.clear();
}

