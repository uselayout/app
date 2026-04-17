import type { ExtractedToken } from "@/lib/types";

/** Result of walking a token's reference chain. */
export interface ResolvedToken {
  /** The starting token's CSS variable name. */
  variable: string;
  /** The value after resolving all `reference` hops. */
  resolvedValue: string;
  /** The chain of CSS variable names traversed, starting at the alias and ending at the concrete value. */
  chain: string[];
  /** True when the start token had a reference and the chain has >= 2 entries. */
  isAlias: boolean;
  /** True when the chain hit a cycle or an unresolvable target. */
  partial: boolean;
}

/** Parse a CSS custom-property reference like `var(--foo)` → `--foo`, or return the input. */
function parseVarRef(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.trim().match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,[^)]*)?\)$/);
  return match ? match[1] : null;
}

/**
 * Walk a token's reference chain to find the concrete value. Handles
 * primitive-to-semantic aliases (e.g. `--primary: var(--primitive-red-400)`)
 * and deeper chains. Cycle-safe (tracks seen variables) and depth-capped.
 */
export function resolveTokenAlias(
  token: ExtractedToken,
  allTokens: ExtractedToken[]
): ResolvedToken {
  const start = token.cssVariable ?? `--${token.name}`;
  const chain: string[] = [start];
  const seen = new Set<string>([start]);

  let currentValue: string = token.value;
  let currentRef: string | undefined = token.reference;

  const byVar = new Map<string, ExtractedToken>();
  for (const t of allTokens) {
    if (t.cssVariable) byVar.set(t.cssVariable, t);
  }

  let partial = false;
  for (let depth = 0; depth < 16; depth++) {
    const targetVar = parseVarRef(currentRef) ?? parseVarRef(currentValue);
    if (!targetVar) break;
    if (seen.has(targetVar)) {
      partial = true;
      break;
    }
    const next = byVar.get(targetVar);
    if (!next) {
      partial = true;
      chain.push(targetVar);
      break;
    }
    seen.add(targetVar);
    chain.push(targetVar);
    currentValue = next.value;
    currentRef = next.reference;
  }

  return {
    variable: start,
    resolvedValue: currentValue,
    chain,
    isAlias: chain.length > 1,
    partial,
  };
}
