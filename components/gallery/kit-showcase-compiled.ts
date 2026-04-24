import "server-only";
import { transpileTsx } from "@/lib/transpile";
import { KIT_SHOWCASE_TSX } from "./kit-showcase-source";

// Transpile once at module load. The showcase TSX is static so we never need
// to hit /api/transpile (which requires auth) from the client. Saves a round
// trip and lets anonymous visitors see the Live Preview.
let cached: string | null = null;

export function getKitShowcaseJs(): string {
  if (cached) return cached;
  cached = transpileTsx(KIT_SHOWCASE_TSX);
  return cached;
}
