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

/** Max 2 concurrent Playwright browser instances (120s queue timeout) */
export const playwrightLimit = createLimiter(2, 120_000);

/** Max 5 concurrent Claude API generation streams (60s queue timeout) */
export const generationLimit = createLimiter(5, 60_000);
