#!/usr/bin/env npx tsx
/**
 * Database migration runner.
 *
 * Reads SQL files from migrations/ in order, checks which have already been
 * applied (via layout_migrations table), and runs any pending ones.
 *
 * Usage:
 *   npx tsx scripts/migrate.ts                # Run pending migrations
 *   npx tsx scripts/migrate.ts --dry-run      # Show pending without running
 *   npx tsx scripts/migrate.ts --status       # Show migration status
 *
 * Requires DATABASE_URL environment variable (or .env file).
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const migrationsDir = join(import.meta.dirname ?? __dirname, "..", "migrations");

const isDryRun = process.argv.includes("--dry-run");
const isStatus = process.argv.includes("--status");

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS layout_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>(
    "SELECT name FROM layout_migrations ORDER BY id"
  );
  return new Set(rows.map((r) => r.name));
}

async function getMigrationFiles(): Promise<string[]> {
  const files = await readdir(migrationsDir);
  return files
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function runMigration(filename: string): Promise<void> {
  const filepath = join(migrationsDir, filename);
  const sql = await readFile(filepath, "utf-8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO layout_migrations (name) VALUES ($1)",
      [filename]
    );
    await client.query("COMMIT");
    console.log(`  Applied: ${filename}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw new Error(`Migration ${filename} failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();
  const pending = files.filter((f) => !applied.has(f));

  if (isStatus) {
    console.log(`Total migrations: ${files.length}`);
    console.log(`Applied: ${applied.size}`);
    console.log(`Pending: ${pending.length}`);
    if (pending.length > 0) {
      console.log("\nPending migrations:");
      for (const f of pending) {
        console.log(`  - ${f}`);
      }
    }
    return;
  }

  if (pending.length === 0) {
    console.log("All migrations are up to date.");
    return;
  }

  console.log(`${pending.length} pending migration(s):`);
  for (const f of pending) {
    console.log(`  - ${f}`);
  }

  if (isDryRun) {
    console.log("\nDry run complete. No migrations applied.");
    return;
  }

  console.log("\nApplying migrations...");
  for (const f of pending) {
    await runMigration(f);
  }

  console.log(`\nDone. ${pending.length} migration(s) applied.`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
