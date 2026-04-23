#!/usr/bin/env npx tsx
/**
 * Sync draft changelog entries from content/changelog/draft.ts into the
 * layout_changelog_draft table on staging or production.
 *
 * Usage:
 *   npx tsx scripts/add-changelog.ts --env staging
 *   npx tsx scripts/add-changelog.ts --env production
 *
 * Pipes SQL into the relevant Supabase Postgres container on the Hetzner
 * box via SSH. Does NOT read .env.local — that file is for app dev only
 * and may point at a Supabase that isn't used for Layout.
 *
 * Idempotent: upserts by id.
 */

import { spawnSync } from "child_process";
import { draftEntries } from "../content/changelog/draft";

const SSH_HOST = "root@94.130.130.22";
const CONTAINERS = {
  staging: "supabase-db-uz0sxsjudyre736ub4rsepet",
  production: "supabase-db-w1rasv0wm54ab3vv0tieobxi",
} as const;

type Env = keyof typeof CONTAINERS;

function parseEnv(): Env {
  const idx = process.argv.indexOf("--env");
  const value = idx >= 0 ? process.argv[idx + 1] : undefined;
  if (value === "staging" || value === "production") return value;
  console.error(
    "Missing or invalid --env flag.\n" +
      "  Usage: npx tsx scripts/add-changelog.ts --env staging\n" +
      "         npx tsx scripts/add-changelog.ts --env production",
  );
  process.exit(1);
}

function buildSql(): string {
  if (draftEntries.length === 0) return "";
  const esc = (s: string) => s.replace(/'/g, "''");
  const values = draftEntries
    .map(
      (e, i) =>
        `('${esc(e.id)}', '${esc(e.title)}', '${esc(e.description)}', '${esc(e.product)}', '${esc(e.category)}', '${esc(e.date)}', ${i})`,
    )
    .join(",\n  ");
  return `INSERT INTO layout_changelog_draft (id, title, description, product, category, date, sort_order) VALUES
  ${values}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  product = EXCLUDED.product,
  category = EXCLUDED.category,
  date = EXCLUDED.date,
  sort_order = EXCLUDED.sort_order;`;
}

function main(): void {
  const env = parseEnv();
  const sql = buildSql();
  if (!sql) {
    console.log("No draft entries to sync.");
    return;
  }
  const container = CONTAINERS[env];
  console.log(`Syncing ${draftEntries.length} draft entries to ${env} (${container})...`);
  const result = spawnSync(
    "ssh",
    [SSH_HOST, "docker", "exec", "-i", container, "psql", "-U", "postgres"],
    { input: sql, stdio: ["pipe", "inherit", "inherit"] },
  );
  if (result.status !== 0) {
    console.error(`SSH/psql failed with exit code ${result.status}.`);
    process.exit(1);
  }
  console.log(`Done. Synced ${draftEntries.length} entries to ${env}.`);
}

main();
