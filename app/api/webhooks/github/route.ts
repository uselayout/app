import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase/client";

/**
 * GitHub Webhook Handler
 *
 * Receives push events from GitHub and triggers component re-scanning
 * for projects linked to the repository.
 *
 * GitHub webhook docs: https://docs.github.com/en/webhooks
 *
 * Verification: HMAC-SHA256 via X-Hub-Signature-256 header.
 * The webhook secret is stored per-org in layout_webhook_config (provider = 'github').
 *
 * DB dependency: layout_webhook_config table (same as Figma webhooks),
 * plus github_repo column on layout_projects.
 */

// ---------------------------------------------------------------------------
// Debounce
// ---------------------------------------------------------------------------

/** Debounce map: projectId -> last scan timestamp (ms). */
const scanDebounce = new Map<string, number>();

/** Minimum interval between re-scans for the same project (ms). */
const DEBOUNCE_MS = 60_000;

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

function verifyGitHubSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// POST - Receive webhook events
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Hub-Signature-256");
  const event = request.headers.get("X-GitHub-Event");

  // Parse body
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle ping (GitHub sends this when a webhook is first registered)
  if (event === "ping") {
    return NextResponse.json({ status: "ok" });
  }

  // Only handle push events
  if (event !== "push") {
    return NextResponse.json({ status: "ignored", event });
  }

  const repository = payload.repository as
    | Record<string, unknown>
    | undefined;
  const repoFullName = repository?.full_name as string | undefined;
  const ref = payload.ref as string | undefined;
  const branch = ref?.replace("refs/heads/", "");

  if (!repoFullName) {
    return NextResponse.json(
      { error: "Missing repository info" },
      { status: 400 }
    );
  }

  // Look up webhook config for this repo
  const { data: configs } = await supabase
    .from("layout_webhook_config")
    .select(
      "id, org_id, passcode, github_owner, github_repo, github_branch"
    )
    .eq("provider", "github")
    .eq("enabled", true)
    .limit(10);

  const matchingConfig = (configs ?? []).find((c) => {
    const configOwner = c.github_owner as string | null;
    const configRepo = c.github_repo as string | null;
    const configBranch = c.github_branch as string | null;

    if (!configOwner || !configRepo) return false;

    const fullName = `${configOwner}/${configRepo}`;
    return (
      fullName.toLowerCase() === repoFullName.toLowerCase() &&
      (!configBranch || configBranch === branch)
    );
  });

  if (!matchingConfig) {
    return NextResponse.json({
      status: "ok",
      message: "No matching config",
    });
  }

  // Verify signature if passcode (webhook secret) is set
  const passcode = matchingConfig.passcode as string | null;
  if (passcode && signature) {
    if (!verifyGitHubSignature(rawBody, signature, passcode)) {
      console.warn("[github-webhook] Signature verification failed");
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 401 }
      );
    }
  } else if (passcode && !signature) {
    // Secret is configured but no signature was sent - reject
    console.warn("[github-webhook] Missing signature header");
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 401 }
    );
  }

  // Find project linked to this repo
  const orgId = matchingConfig.org_id as string;
  const { data: project } = await supabase
    .from("layout_projects")
    .select("id, org_id, name")
    .eq("org_id", orgId)
    .eq("github_repo", repoFullName)
    .limit(1)
    .maybeSingle();

  if (!project) {
    console.info(
      `[github-webhook] No project linked to ${repoFullName}`
    );
    return NextResponse.json({
      status: "ok",
      message: "No linked project",
    });
  }

  // Debounce: skip if a scan was triggered within the last 60 seconds
  const lastScan = scanDebounce.get(project.id) ?? 0;
  const now = Date.now();

  if (now - lastScan < DEBOUNCE_MS) {
    const remainingSec = Math.ceil(
      (DEBOUNCE_MS - (now - lastScan)) / 1000
    );
    console.info(
      `[github-webhook] Debounced for project ${project.id} (${remainingSec}s remaining)`
    );
    return NextResponse.json({
      status: "ok",
      message: `Debounced, retry in ${remainingSec}s`,
      projectId: project.id,
    });
  }

  scanDebounce.set(project.id, now);

  // TODO: Trigger actual GitHub API scan (needs Octokit).
  // For now, log the event. When Octokit is installed, this should:
  // 1. Fetch the repo tree via GitHub API
  // 2. Scan for React/Vue/Svelte components
  // 3. POST results to the scan-results endpoint above
  console.info(
    "[github-webhook] Push received",
    JSON.stringify({
      repo: repoFullName,
      branch,
      projectId: project.id,
      projectName: project.name,
      orgId: project.org_id,
    })
  );

  return NextResponse.json({
    status: "ok",
    message: "Webhook received - scan queued",
    projectId: project.id,
  });
}
