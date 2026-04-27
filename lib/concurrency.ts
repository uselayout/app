/**
 * Module-level concurrency limiters to prevent resource exhaustion.
 *
 * Playwright browsers use ~150-300MB RAM each. Without a cap, concurrent
 * website extractions can OOM the server. These limiters queue excess
 * requests until a slot opens.
 */

export class ConcurrencyTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConcurrencyTimeoutError";
  }
}

function createLimiter(maxConcurrent: number, timeoutMs = 120_000) {
  let active = 0;
  const waiting: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];

  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= maxConcurrent) {
      await new Promise<void>((resolve, reject) => {
        const entry = { resolve, reject };
        waiting.push(entry);

        const timer = setTimeout(() => {
          const idx = waiting.indexOf(entry);
          if (idx !== -1) {
            waiting.splice(idx, 1);
            reject(new ConcurrencyTimeoutError(
              `Timed out waiting for concurrency slot after ${timeoutMs}ms`
            ));
          }
        }, timeoutMs);

        // Store cleanup so resolve can clear the timer
        const originalResolve = entry.resolve;
        entry.resolve = () => {
          clearTimeout(timer);
          originalResolve();
        };
      });
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      const next = waiting.shift();
      if (next) next.resolve();
    }
  };
}

/** Max 6 concurrent Playwright browser instances (120s queue timeout) */
export const playwrightLimit = createLimiter(6, 120_000);

/** Max 10 concurrent Claude API generation streams (60s queue timeout) */
export const generationLimit = createLimiter(10, 60_000);

/**
 * Max 2 concurrent bespoke showcase generations. Tighter than
 * generationLimit because each call ends with `transpileTsx()` — a
 * synchronous TypeScript compile that pegs the Node single-thread.
 * Seven of these in flight at once saturated the CPU and blocked the
 * /api/health/ready endpoint, causing Coolify to mark the container
 * unhealthy and Traefik to drop the backend. 2 keeps headroom for
 * other request handlers. 3 min queue (bespoke generation can take
 * 60-90s with max_tokens 16000).
 */
export const bespokeShowcaseLimit = createLimiter(2, 180_000);

/**
 * Max 3 concurrent style-profile generations. Shorter Claude output
 * (JSON, ~3000 tokens), no transpile, so cheaper than bespoke — but
 * still bounded so we never repeat the CPU starvation incident.
 */
export const styleProfileLimit = createLimiter(3, 90_000);

/**
 * Max 1 concurrent hero generation. GPT Image 2 takes ~30s and the
 * response is decoded from base64 into a Buffer — under load this
 * compounds with bespoke + snapshot to push the container over the
 * edge. Single-flight is fine because publishes happen one-at-a-time.
 */
export const heroGenerationLimit = createLimiter(1, 120_000);

/**
 * Max 1 concurrent Playwright kit-card snapshot. A Chromium browser
 * launch + viewport render + PNG capture is the heaviest single
 * operation in the publish pipeline (~30s, 150-300MB RAM). Capping
 * at 1 keeps memory bounded and stops two snapshots fighting for
 * GPU/CPU on the same Linux container.
 */
export const kitSnapshotLimit = createLimiter(1, 120_000);

/**
 * Max 1 concurrent staging→prod kit promote. Each promote is mostly
 * network I/O (one POST + N storage uploads), but the storage uploads
 * could include MB-scale font files and we don't want a misclick to
 * fan out 10 promotes at once and saturate the upstream Supabase.
 * Single-flight is fine — admin promotes happen one-at-a-time anyway.
 */
export const promoteLimit = createLimiter(1, 120_000);
