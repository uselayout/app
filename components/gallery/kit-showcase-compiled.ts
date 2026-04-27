import "server-only";
import { transpileTsx } from "@/lib/transpile";
import { KIT_SHOWCASE_TSX } from "./kit-showcase-source";

// Transpile once at module load. The showcase TSX is static so we never need
// to hit /api/transpile (which requires auth) from the client. Saves a round
// trip and lets anonymous visitors see the Live Preview.
let cached: string | null = null;
let pending: Promise<string> | null = null;

export async function getKitShowcaseJs(): Promise<string> {
  if (cached) return cached;
  // Coalesce concurrent first-hits onto a single transpile.
  if (!pending) {
    pending = transpileTsx(KIT_SHOWCASE_TSX).then((js) => {
      cached = js;
      pending = null;
      return js;
    });
  }
  return pending;
}
