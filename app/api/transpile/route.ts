import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  transpileModule,
  ModuleKind,
  JsxEmit,
  ScriptTarget,
} from "typescript";

const schema = z.object({ code: z.string().max(200_000) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code } = parsed.data;

  try {
    // TypeScript transpiles TSX → CommonJS JS:
    // - strips all types and interfaces
    // - transforms JSX to React.createElement calls
    // - converts import statements to require() calls
    // - converts export statements to exports.X = ... assignments
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

    return NextResponse.json({ js: result.outputText });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
