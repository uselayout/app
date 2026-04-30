import { DiagnosticCategory, flattenDiagnosticMessageText, JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";

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
    reportDiagnostics: true,
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

  // transpileModule happily emits broken JS even when it parses syntax
  // errors (e.g. an AI-generated typo like `i / > 0 ? ... : ...`). The
  // iframe is then the first thing to parse the output strictly, and
  // surfaces a cryptic "Unexpected token '>'" at a random srcdoc line.
  // Surface the real error here so /api/transpile returns a clear 400.
  const errorDiag = result.diagnostics?.find((d) => d.category === DiagnosticCategory.Error);
  if (errorDiag) {
    const msg = flattenDiagnosticMessageText(errorDiag.messageText, "\n");
    throw new TranspileError(`TSX syntax error: ${msg}`, locateError(code, errorDiag.start));
  }

  return result.outputText;
}

/** Subclass so the API route can pull line/col without parsing the message. */
export class TranspileError extends Error {
  constructor(message: string, public readonly position: { line: number; column: number } | null) {
    super(message);
    this.name = "TranspileError";
  }
}

/** Translate a TS character offset into 1-indexed line/column for the editor. */
function locateError(code: string, start: number | undefined): { line: number; column: number } | null {
  if (start === undefined || start < 0) return null;
  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < start && i < code.length; i++) {
    if (code.charCodeAt(i) === 10 /* \n */) {
      line++;
      lastNewline = i;
    }
  }
  return { line, column: start - lastNewline };
}
