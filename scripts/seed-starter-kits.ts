#!/usr/bin/env npx tsx
/**
 * Seed the three bundled Layout starter kits (linear-lite, stripe-lite,
 * notion-lite) into the public Kit Gallery. Idempotent: re-running does not
 * create duplicates (ON CONFLICT on slug DO NOTHING).
 *
 * Usage:
 *   npx tsx scripts/seed-starter-kits.ts --env staging
 *   npx tsx scripts/seed-starter-kits.ts --env production
 *
 * Reads kit files from the adjacent layout-context CLI repo. Override with
 * --kits-dir if the repo lives somewhere else:
 *   npx tsx scripts/seed-starter-kits.ts --env staging --kits-dir /path/to/layout-context/kits
 *
 * Kits are attributed to "Layout" as the author. Use the in-Studio share flow
 * (or the CLI `layout publish` command, once that ships) for user-submitted
 * kits.
 */

import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const SSH_HOST = "root@94.130.130.22";
const CONTAINERS = {
  staging: "supabase-db-uz0sxsjudyre736ub4rsepet",
  production: "supabase-db-w1rasv0wm54ab3vv0tieobxi",
} as const;

type Env = keyof typeof CONTAINERS;

// Seed these slugs against the layout-context/kits folder names.
const STARTER_KITS = [
  {
    slug: "linear-lite",
    tags: ["dark", "minimal", "developer-tool", "saas"],
    description: "Dark, minimal developer-tool aesthetic. Tight spacing, indigo accent, JetBrains Mono.",
  },
  {
    slug: "stripe-lite",
    tags: ["light", "minimal", "fintech", "saas"],
    description: "Clean, high-trust light palette with generous spacing. Suited to fintech and checkout flows.",
  },
  {
    slug: "notion-lite",
    tags: ["light", "content-first", "minimal", "saas"],
    description: "White-background, content-first, block-based. Emoji-friendly.",
  },
] as const;

const LAYOUT_AUTHOR = {
  orgId: "layout-team",
  userId: "layout-team",
  displayName: "Layout",
  avatarUrl: "https://layout.design/favicon.png",
};

function parseArgs(): { env: Env; kitsDir: string } {
  const envIdx = process.argv.indexOf("--env");
  const envValue = envIdx >= 0 ? process.argv[envIdx + 1] : undefined;
  if (envValue !== "staging" && envValue !== "production") {
    console.error("Missing --env staging|production");
    process.exit(1);
  }

  const kitsIdx = process.argv.indexOf("--kits-dir");
  let kitsDir = kitsIdx >= 0 ? process.argv[kitsIdx + 1] : undefined;
  if (!kitsDir) {
    // Default: sibling layout-context repo two levels up from studio root.
    const candidates = [
      path.resolve(process.cwd(), "../layout-context/kits"),
      path.resolve(process.cwd(), "../../layout-context/kits"),
      path.resolve(process.cwd(), "../../../layout-context/kits"),
      path.resolve(process.cwd(), "../../../../layout-context/kits"),
    ];
    kitsDir = candidates.find((p) => existsSync(p));
  }
  if (!kitsDir || !existsSync(kitsDir)) {
    console.error(`Could not find kits directory. Pass --kits-dir /path/to/layout-context/kits`);
    process.exit(1);
  }
  return { env: envValue, kitsDir };
}

function readKit(kitsDir: string, slug: string) {
  const dir = path.join(kitsDir, slug);
  const layoutMd = readFileSync(path.join(dir, "layout.md"), "utf8");
  const tokensCss = readFileSync(path.join(dir, "tokens.css"), "utf8");
  const tokensJsonRaw = readFileSync(path.join(dir, "tokens.json"), "utf8");
  const kitJsonRaw = readFileSync(path.join(dir, "kit.json"), "utf8");
  const originalKitJson = JSON.parse(kitJsonRaw) as { displayName?: string; description?: string };

  return {
    layoutMd,
    tokensCss,
    tokensJson: JSON.parse(tokensJsonRaw) as Record<string, unknown>,
    originalKitJson,
  };
}

function sqlEscape(s: string): string {
  // Using dollar-quoting below for body text, so only SQL identifiers get
  // single-quote escaping.
  return s.replace(/'/g, "''");
}

function buildInsertSql(kitsDir: string): string {
  const inserts: string[] = [];

  for (const seed of STARTER_KITS) {
    const { layoutMd, tokensCss, tokensJson, originalKitJson } = readKit(kitsDir, seed.slug);
    const name = originalKitJson.displayName ?? seed.slug;
    const description = seed.description ?? originalKitJson.description ?? "";

    const kitJson = {
      schemaVersion: 1,
      slug: seed.slug,
      name,
      description,
      tags: seed.tags,
      licence: "MIT",
      author: LAYOUT_AUTHOR,
      tier: "minimal",
      publishedAt: new Date().toISOString(),
    };

    const tagsArr = `ARRAY[${seed.tags.map((t) => `'${sqlEscape(t)}'`).join(", ")}]::text[]`;

    inserts.push(`
INSERT INTO layout_public_kit (
  slug, name, description, tags,
  author_org_id, author_user_id, author_display_name, author_avatar_url,
  licence, layout_md, tokens_css, tokens_json, kit_json,
  tier, featured, unlisted
) VALUES (
  '${sqlEscape(seed.slug)}',
  '${sqlEscape(name)}',
  '${sqlEscape(description)}',
  ${tagsArr},
  '${sqlEscape(LAYOUT_AUTHOR.orgId)}',
  '${sqlEscape(LAYOUT_AUTHOR.userId)}',
  '${sqlEscape(LAYOUT_AUTHOR.displayName)}',
  '${sqlEscape(LAYOUT_AUTHOR.avatarUrl)}',
  'MIT',
  $layoutmd$${layoutMd}$layoutmd$,
  $tokenscss$${tokensCss}$tokenscss$,
  $tokensjson$${JSON.stringify(tokensJson)}$tokensjson$::jsonb,
  $kitjson$${JSON.stringify(kitJson)}$kitjson$::jsonb,
  'minimal',
  true,
  false
) ON CONFLICT (slug) DO NOTHING;`);
  }

  return inserts.join("\n");
}

function main(): void {
  const { env, kitsDir } = parseArgs();
  const sql = buildInsertSql(kitsDir);
  const container = CONTAINERS[env];
  console.log(`Seeding ${STARTER_KITS.length} kits into ${env} (${container})...`);
  const result = spawnSync(
    "ssh",
    [SSH_HOST, "docker", "exec", "-i", container, "psql", "-U", "postgres"],
    { input: sql, stdio: ["pipe", "inherit", "inherit"] },
  );
  if (result.status !== 0) {
    console.error(`SSH/psql failed with exit code ${result.status}.`);
    process.exit(1);
  }
  console.log(`Seeded starter kits into ${env}. Visit /gallery to verify.`);
}

main();
