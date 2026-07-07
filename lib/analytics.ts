"use client";

/**
 * Minimal PostHog wrapper for golden-path funnel events.
 *
 * Design goals:
 *  - Graceful no-op when NEXT_PUBLIC_POSTHOG_KEY is unset (local dev,
 *    self-hosted installs) so call sites never need to guard.
 *  - posthog-js is loaded via dynamic import on first capture, keeping it
 *    out of the marketing-page initial bundle.
 *  - Events fired before the library finishes loading are queued and
 *    flushed once init completes, so no early clicks are lost.
 */

type EventProps = Record<string, string | number | boolean | string[]>;

interface PostHogLike {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, props?: EventProps) => void;
}

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let client: PostHogLike | null = null;
let loading: Promise<void> | null = null;
const queue: Array<{ event: string; props?: EventProps }> = [];

function ensureLoaded(): void {
  if (client || loading) return;
  loading = import("posthog-js")
    .then((mod) => {
      const posthog = mod.default as unknown as PostHogLike;
      posthog.init(KEY as string, {
        api_host: HOST,
        // Funnel events are explicit; skip autocapture noise.
        autocapture: false,
        capture_pageview: false,
        persistence: "localStorage+cookie",
      });
      client = posthog;
      for (const item of queue.splice(0)) {
        client.capture(item.event, item.props);
      }
    })
    .catch(() => {
      // Analytics must never break the product. Drop the queue and stay
      // a no-op for the rest of the session.
      queue.length = 0;
      loading = null;
    });
}

/**
 * Capture a product analytics event. No-ops on the server and when
 * NEXT_PUBLIC_POSTHOG_KEY is not configured.
 */
export function capture(event: string, props?: EventProps): void {
  if (typeof window === "undefined" || !KEY) return;
  if (client) {
    client.capture(event, props);
    return;
  }
  queue.push({ event, props });
  ensureLoaded();
}
