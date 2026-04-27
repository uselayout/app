import { transpileModule, ModuleKind, JsxEmit, ScriptTarget } from "typescript";

/**
 * JSX/TSX → CommonJS JS transform.
 *
 * Uses TypeScript's transpileModule. Output shape is what the gallery
 * iframe runtime shim expects (single-file CommonJS with the standard
 * `exports.default = App` / `module.exports = App` pattern). Earlier
 * attempt to swap for esbuild's transform produced a different export
 * envelope that the iframe couldn't load — every bespoke kit rendered
 * as "Script error".
 *
 * The internal transpileModule call is synchronous and can block the Node
 * single-thread for 100-500ms on a 16KB TSX file. We yield the event loop
 * before it runs so the healthcheck and other queued requests get a chance
 * to land — without this, two concurrent admin showcase regens were enough
 * to fail /api/health/ready under the existing bespokeShowcaseLimit.
 */
export async function transpileTsx(code: string): Promise<string> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  const result = transpileModule(code, {
    compilerOptions: {
      module: ModuleKind.CommonJS,
      jsx: JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      target: ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: "component.tsx",
  });
  return result.outputText;
}
