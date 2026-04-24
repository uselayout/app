#!/usr/bin/env npx tsx
/**
 * Attach a brand logo to the three seeded demo kits so the hero-cover
 * generator can route them through /v1/images/edits with a real reference
 * image. Uses GitHub org avatars (public PNGs, no auth, no binary download
 * needed) as the source of truth.
 *
 * Usage:
 *   npx tsx scripts/seed-kit-logos.ts --env staging
 *   npx tsx scripts/seed-kit-logos.ts --env production
 *
 * Idempotent: re-running overwrites the rich_bundle.brandingAssets logo
 * entry for each slug, keeping any other assets (fonts, branding docs) in
 * place.
 */

import { spawnSync } from "node:child_process";

const SSH_HOST = "root@94.130.130.22";
const CONTAINERS = {
  staging: "supabase-db-uz0sxsjudyre736ub4rsepet",
  production: "supabase-db-w1rasv0wm54ab3vv0tieobxi",
} as const;

type Env = keyof typeof CONTAINERS;

const LOGOS = [
  { slug: "stripe-lite", name: "Stripe", url: "https://github.com/stripe.png" },
  { slug: "linear-lite", name: "Linear", url: "https://github.com/linear.png" },
  { slug: "notion-lite", name: "Notion", url: "https://github.com/makenotion.png" },
] as const;

function parseEnv(): Env {
  const envIdx = process.argv.indexOf("--env");
  const v = envIdx >= 0 ? process.argv[envIdx + 1] : undefined;
  if (v !== "staging" && v !== "production") {
    console.error("Missing --env staging|production");
    process.exit(1);
  }
  return v;
}

// Builds a jsonb_build_object that preserves any existing non-logo assets and
// replaces the logo entry, then UPDATEs rich_bundle.
function buildUpdateSql(): string {
  const statements = LOGOS.map((l) => {
    const asset = {
      slot: "logo",
      url: l.url,
      name: `${l.name} mark`,
      mimeType: "image/png",
    };
    const assetJson = JSON.stringify(asset).replace(/'/g, "''");
    return `
UPDATE layout_public_kit
SET rich_bundle = jsonb_set(
  COALESCE(rich_bundle, '{}'::jsonb),
  '{brandingAssets}',
  COALESCE(
    (
      SELECT jsonb_agg(entry) || '${assetJson}'::jsonb
      FROM jsonb_array_elements(COALESCE(rich_bundle->'brandingAssets', '[]'::jsonb)) AS entry
      WHERE entry->>'slot' IS DISTINCT FROM 'logo'
    ),
    jsonb_build_array('${assetJson}'::jsonb)
  )
)
WHERE slug = '${l.slug}';`;
  });
  return statements.join("\n");
}

function main(): void {
  const env = parseEnv();
  const container = CONTAINERS[env];
  const sql = buildUpdateSql();

  console.log(`Attaching ${LOGOS.length} brand logos to kits in ${env} (${container})...`);
  for (const l of LOGOS) console.log(`  - ${l.slug} -> ${l.url}`);

  const result = spawnSync(
    "ssh",
    [SSH_HOST, "docker", "exec", "-i", container, "psql", "-U", "postgres"],
    { input: sql, stdio: ["pipe", "inherit", "inherit"] },
  );
  if (result.status !== 0) {
    console.error(`SSH/psql failed with exit code ${result.status}.`);
    process.exit(1);
  }
  console.log(`\nDone. Trigger Regen hero in /admin/kits to see reference-image output.`);
}

main();
