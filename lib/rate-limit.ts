const rateLimit = (options: { interval: number; uniqueTokenPerInterval: number }) => {
  const tokenCache = new Map<string, number[]>();

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of tokenCache.entries()) {
      const valid = timestamps.filter(t => now - t < options.interval);
      if (valid.length === 0) tokenCache.delete(key);
      else tokenCache.set(key, valid);
    }
  }, options.interval);

  return {
    check: (limit: number, token: string): { success: boolean; remaining: number } => {
      const now = Date.now();
      const timestamps = tokenCache.get(token) ?? [];
      const valid = timestamps.filter(t => now - t < options.interval);

      if (valid.length >= limit) {
        return { success: false, remaining: 0 };
      }

      valid.push(now);
      tokenCache.set(token, valid);
      return { success: true, remaining: limit - valid.length };
    }
  };
};

export default rateLimit;
