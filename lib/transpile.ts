import { transpileModule, ModuleKind, JsxEmit, ScriptTarget } from "typescript";

export function transpileTsx(code: string): string {
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
