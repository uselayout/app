import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FigmaClient, FigmaApiError, parseRetryAfterMs } from "./client";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function rateLimited(retryAfter?: string): Response {
  return new Response("rate limited", {
    status: 429,
    headers: retryAfter ? { "Retry-After": retryAfter } : {},
  });
}

describe("parseRetryAfterMs", () => {
  it("parses delta-seconds", () => {
    expect(parseRetryAfterMs("120")).toBe(120_000);
  });

  it("parses an HTTP-date relative to now", () => {
    const future = new Date(Date.now() + 60_000).toUTCString();
    const ms = parseRetryAfterMs(future);
    expect(ms).toBeGreaterThan(50_000);
    expect(ms).toBeLessThanOrEqual(61_000);
  });

  it("returns null for missing or malformed values", () => {
    expect(parseRetryAfterMs(null)).toBeNull();
    expect(parseRetryAfterMs("soon")).toBeNull();
  });
});

describe("FigmaClient 429 handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("retries after a short Retry-After and succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rateLimited("2"))
      .mockResolvedValueOnce(jsonResponse({ name: "File", document: {} }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new FigmaClient({ accessToken: "token" });
    const promise = client.getFile("abc123");
    await vi.runAllTimersAsync();
    const file = await promise;

    expect(file.name).toBe("File");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails fast with a surfaced error when Retry-After exceeds the cap", async () => {
    // Figma's plan/seat limits have been reported to return multi-day
    // Retry-After values; we must not sleep through those.
    const fetchMock = vi.fn().mockResolvedValue(rateLimited(String(60 * 60 * 24)));
    vi.stubGlobal("fetch", fetchMock);

    const client = new FigmaClient({ accessToken: "token" });
    const promise = client.getFile("abc123");
    promise.catch(() => {}); // avoid unhandled rejection while timers run
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({
      name: "FigmaApiError",
      statusCode: 429,
    });
    await expect(promise).rejects.toThrow(/rate limit/i);
    // No retry: a single request, then a clear error for the extraction UI.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up with a 429 FigmaApiError after exhausting retries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(rateLimited());
    vi.stubGlobal("fetch", fetchMock);

    const client = new FigmaClient({ accessToken: "token" });
    const promise = client.getFile("abc123");
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toBeInstanceOf(FigmaApiError);
    await expect(promise).rejects.toThrow(/retries were exhausted/i);
    // Initial attempt + MAX_RETRIES worth of retry sleeps, no infinite loop.
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
