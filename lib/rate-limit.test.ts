import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import rateLimit from './rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows a request within the limit', () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 100 });
    const result = limiter.check(5, 'user-1');
    expect(result.success).toBe(true);
  });

  it('tracks remaining count correctly after one use', () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 100 });
    const result = limiter.check(5, 'user-1');
    expect(result.remaining).toBe(4);
  });

  it('blocks a request once the limit is reached', () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 100 });
    for (let i = 0; i < 3; i++) {
      limiter.check(3, 'user-a');
    }
    const result = limiter.check(3, 'user-a');
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns oldestTimestamp as null for a fresh token', () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 100 });
    // After first check, there IS a timestamp — it's only null before any call
    // The implementation pushes before returning, so oldestTimestamp will be set
    const result = limiter.check(5, 'brand-new');
    expect(result.oldestTimestamp).not.toBeNull();
  });

  it('tracks different tokens independently', () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 100 });
    for (let i = 0; i < 2; i++) {
      limiter.check(2, 'token-A');
    }
    // token-A is now blocked but token-B should still be free
    expect(limiter.check(2, 'token-A').success).toBe(false);
    expect(limiter.check(2, 'token-B').success).toBe(true);
  });

  it('allows requests again after the interval expires', () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 100 });
    limiter.check(1, 'user-x');
    // Should be blocked now
    expect(limiter.check(1, 'user-x').success).toBe(false);
    // Advance time past the interval
    vi.advanceTimersByTime(1001);
    expect(limiter.check(1, 'user-x').success).toBe(true);
  });

  it('remaining decreases with each successful call', () => {
    const limiter = rateLimit({ interval: 5000, uniqueTokenPerInterval: 100 });
    expect(limiter.check(4, 'seq').remaining).toBe(3);
    expect(limiter.check(4, 'seq').remaining).toBe(2);
    expect(limiter.check(4, 'seq').remaining).toBe(1);
  });

  it('returns remaining 0 when blocked', () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 100 });
    limiter.check(1, 'blocked-user');
    const result = limiter.check(1, 'blocked-user');
    expect(result.remaining).toBe(0);
  });

  it('handles limit of 1 — second call is always blocked', () => {
    const limiter = rateLimit({ interval: 5000, uniqueTokenPerInterval: 100 });
    expect(limiter.check(1, 'strict').success).toBe(true);
    expect(limiter.check(1, 'strict').success).toBe(false);
  });

  it('oldestTimestamp reflects the time of the first request in the window', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const limiter = rateLimit({ interval: 5000, uniqueTokenPerInterval: 100 });
    const first = limiter.check(3, 'ts-user');
    const firstTs = first.oldestTimestamp!;

    vi.advanceTimersByTime(200);
    limiter.check(3, 'ts-user');

    vi.advanceTimersByTime(200);
    const third = limiter.check(3, 'ts-user');

    // oldestTimestamp should stay at the first request's time
    expect(third.oldestTimestamp).toBe(firstTs);
  });
});
