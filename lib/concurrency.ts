/**
 * Module-level concurrency limiters to prevent resource exhaustion.
 *
 * Playwright browsers use ~150-300MB RAM each. Without a cap, concurrent
 * website extractions can OOM the server. These limiters queue excess
 * requests until a slot opens.
 */

function createLimiter(maxConcurrent: number) {
  let active = 0;
  const waiting: Array<() => void> = [];

  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= maxConcurrent) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      const next = waiting.shift();
      if (next) next();
    }
  };
}

/** Max 2 concurrent Playwright browser instances */
export const playwrightLimit = createLimiter(2);

/** Max 5 concurrent Claude API generation streams */
export const generationLimit = createLimiter(5);
