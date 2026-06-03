#!/usr/bin/env npx tsx
/**
 * Re-shell bespoke kit showcases WITHOUT calling Claude.
 *
 * A bespoke kit's showcase_custom_tsx is `const BESPOKE_BLOCKS = {...}` (Claude's
 * per-kit component blocks) concatenated with a snapshot of KIT_SHOWCASE_TSX (the
 * shell: App/nav/scroll-spy/section framing). When the shell changes (e.g. the
 * mobile-responsive fix), existing kits keep their frozen old shell. This script
 * keeps each kit's blocks, swaps in the CURRENT shell, re-transpiles, and writes
 * both columns back — no Claude, no design changes, near-instant.
 *
 * Reads/writes the DB directly over SSH (docker exec psql), matching the project
 * convention for migrations. No ADMIN_API_KEY needed.
 *
 * Usage:
 *   npx tsx scripts/reshell-bespoke.ts --env staging --slug airbnb
 *   npx tsx scripts/reshell-bespoke.ts --env staging --all
 *   npx tsx scripts/reshell-bespoke.ts --env staging --all --dry-run
 *   npx tsx scripts/reshell-bespoke.ts --env production --all
 */

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { KIT_SHOWCASE_TSX } from "../components/gallery/kit-showcase-source";
import { transpileTsx } from "../lib/transpile";

const SSH_HOST = "root@94.130.130.22";
const DB_CONTAINER = {
  staging: "supabase-db-uz0sxsjudyre736ub4rsepet",
  production: "supabase-db-w1rasv0wm54ab3vv0tieobxi",
} as const;
type Env = keyof typeof DB_CONTAINER;

const SHELL_START = "type CssVar = { name: string; value: string };";
const TSX_TAG = "$RESHELL_TSX_a9f3$";
const JS_TAG = "$RESHELL_JS_a9f3$";

function parseArgs() {
  const argv = process.argv.slice(2);
  const flag = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const env = flag("--env");
  if (env !== "staging" && env !== "production") { console.error("Missing --env staging|production"); process.exit(1); }
  const all = argv.includes("--all");
  const slug = flag("--slug");
  if (!all && !slug) { console.error("Pass --slug <slug> or --all"); process.exit(1); }
  return { env: env as Env, all, slug, dryRun: argv.includes("--dry-run") };
}

/** Run a read-only SQL query, return raw stdout (tuples-only, unaligned). */
function psqlRead(env: Env, sql: string): string {
  return execFileSync(
    "ssh",
    ["-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10", SSH_HOST,
     `docker exec -i ${DB_CONTAINER[env]} psql -U postgres -At -c ${shellQuote(sql)}`],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
}

/** Pipe a SQL file into psql over SSH (for large dollar-quoted writes). */
function psqlWriteFile(env: Env, sqlPath: string): string {
  return execFileSync(
    "ssh",
    ["-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10", SSH_HOST,
     `docker exec -i ${DB_CONTAINER[env]} psql -U postgres -v ON_ERROR_STOP=1`],
    { encoding: "utf8", input: require("node:fs").readFileSync(sqlPath), maxBuffer: 16 * 1024 * 1024 },
  );
}

function shellQuote(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

function reshell(storedTsx: string): string {
  const idx = storedTsx.indexOf(SHELL_START);
  if (idx < 0) throw new Error("shell-start marker not found (unexpected TSX shape)");
  const blocks = storedTsx.slice(0, idx).trim();
  if (!blocks.includes("const BESPOKE_BLOCKS")) throw new Error("extracted blocks missing `const BESPOKE_BLOCKS`");
  let composed = blocks + "\n\n" + KIT_SHOWCASE_TSX;
  if (!/export\s+default\s+App/.test(composed)) composed += "\n\nexport default App;";
  return composed;
}

async function reshellOne(env: Env, id: string, slug: string, dryRun: boolean): Promise<void> {
  const stored = psqlRead(env, `select showcase_custom_tsx from layout_public_kit where id = '${id}'`);
  if (!stored.trim()) { console.warn(`  skip ${slug}: empty showcase_custom_tsx`); return; }

  const newTsx = reshell(stored);
  const newJs = await transpileTsx(newTsx);
  if (!newJs.includes("max-width: 640px") || !newJs.includes("data-showcase-shell")) {
    throw new Error("recomposed JS missing mobile shell markers — aborting write");
  }
  if (!newJs.includes("BESPOKE_BLOCKS")) throw new Error("recomposed JS lost BESPOKE_BLOCKS — aborting write");
  if (newTsx.includes(TSX_TAG) || newJs.includes(JS_TAG)) throw new Error("dollar-quote tag collision — aborting");

  if (dryRun) {
    console.log(`  [dry-run] ${slug}: tsx ${stored.length}→${newTsx.length}, js ${newJs.length} (markers OK)`);
    return;
  }

  const dir = mkdtempSync(join(tmpdir(), "reshell-"));
  const sqlPath = join(dir, `${slug}.sql`);
  const sql =
    `UPDATE layout_public_kit SET\n` +
    `  showcase_custom_tsx = ${TSX_TAG}${newTsx}${TSX_TAG},\n` +
    `  showcase_custom_js  = ${JS_TAG}${newJs}${JS_TAG},\n` +
    `  showcase_generated_at = now(),\n` +
    `  updated_at = now()\n` +
    `WHERE id = '${id}';\n`;
  writeFileSync(sqlPath, sql);
  const out = psqlWriteFile(env, sqlPath).trim();
  console.log(`✔ ${slug}: ${out || "UPDATE 1"} (js ${newJs.length} chars)`);
}

async function main(): Promise<void> {
  const { env, all, slug, dryRun } = parseArgs();
  console.log(`Re-shell bespoke → ${env}${dryRun ? " [DRY-RUN]" : ""}`);

  let kits: Array<{ id: string; slug: string }>;
  if (all) {
    const rows = psqlRead(env,
      `select id || '|' || slug from layout_public_kit ` +
      `where status='approved' and not hidden and bespoke_showcase and showcase_custom_tsx is not null order by slug`);
    kits = rows.trim().split("\n").filter(Boolean).map((l) => { const [id, s] = l.split("|"); return { id, slug: s }; });
  } else {
    const row = psqlRead(env, `select id || '|' || slug from layout_public_kit where slug = '${slug}'`).trim();
    if (!row) { console.error(`kit '${slug}' not found`); process.exit(1); }
    const [id, s] = row.split("|");
    kits = [{ id, slug: s }];
  }
  console.log(`Kits: ${kits.length} (${kits.map((k) => k.slug).join(", ")})\n`);

  let ok = 0, fail = 0;
  for (const k of kits) {
    try { await reshellOne(env, k.id, k.slug, dryRun); ok++; }
    catch (e) { console.error(`✘ ${k.slug}: ${e instanceof Error ? e.message : String(e)}`); fail++; }
  }
  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
