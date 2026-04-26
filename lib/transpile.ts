import { transform } from "esbuild";

/**
 * JSX/TSX → CommonJS JS transform.
 *
 * Uses esbuild's async transform: ~10-30ms for typical kit showcases
 * (~16k tokens), vs 5-15s with TypeScript's transpileModule. The TS
 * compiler is heavy and synchronous — it blocked the Node event loop
 * long enough to fail Coolify's 5s healthcheck and trigger 502s on
 * the gallery.  esbuild releases the event loop between chunks so
 * concurrent requests stay responsive.
 *
 * jsxFactory + jsxFragment match the iframe runtime expectations:
 * the iframe pre-destructures React + hooks as globals, no imports.
 */
export async function transpileTsx(code: string): Promise<string> {
  const result = await transform(code, {
    loader: "tsx",
    format: "cjs",
    target: "es2020",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    sourcemap: false,
  });
  return result.code;
}
