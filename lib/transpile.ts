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
 * Function is async only so callers can stay uniform with future
 * off-thread implementations. The internal call is sync.
 */
export async function transpileTsx(code: string): Promise<string> {
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
