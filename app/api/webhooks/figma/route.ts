import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createHash, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase/client";
import { extractFromFigma } from "@/lib/figma/extractor";
import { diffExtractions } from "@/lib/extraction/diff";
import { fetchProjectById } from "@/lib/supabase/db";
import type { ExtractionResult } from "@/lib/types";

/**
 * Figma Webhook Handler
 *
 * Receives FILE_UPDATE events from Figma and triggers re-extraction.
 * Figma docs: https://www.figma.com/developers/api#webhooks_v2
 *
 * Required env:
 *   FIGMA_WEBHOOK_PASSCODE — fallback passcode when not using per-org config
 *
 * Supabase table dependency:
 *
 * -- layout_webhook_config: stores webhook configuration per org
 * -- id uuid PK DEFAULT gen_random_uuid()
 * -- org_id text NOT NULL
 * -- provider text NOT NULL (e.g. 'figma')
 * -- webhook_id text
 * -- passcode text NOT NULL
 * -- github_owner text
 * -- github_repo text
 * -- github_branch text DEFAULT 'main'
 * -- github_token_encrypted text
 * -- enabled boolean DEFAULT true
 * -- created_at timestamptz DEFAULT now()
 * -- updated_at timestamptz DEFAULT now()
 */

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const figmaEventTypes = [
  "FILE_UPDATE",
  "LIBRARY_PUBLISH",
  "FILE_VERSION_UPDATE",
  "FILE_DELETE",
  "PING",
] as const;

const FigmaWebhookPayloadSchema = z.object({
  event_type: z.enum(figmaEventTypes),
  file_key: z.string().min(1),
  file_name: z.string(),
  passcode: z.string(),
  timestamp: z.string(),
  webhook_id: z.string(),
  triggered_by: z
    .object({
      id: z.string(),
      handle: z.string(),
    })
    .optional(),
});

type FigmaWebhookPayload = z.infer<typeof FigmaWebhookPayloadSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Constant-time string comparison (prevents timing attacks). */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/**
 * Verify the passcode from the payload against:
 *  1. A matching row in `layout_webhook_config` (per-org)
 *  2. The `FIGMA_WEBHOOK_PASSCODE` env var (global fallback)
 */
async function verifyPasscode(
  passcode: string,
  webhookId: string
): Promise<boolean> {
  // 1. Check Supabase for a per-org config matching this webhook
  const { data: config } = await supabase
    .from("layout_webhook_config")
    .select("passcode")
    .eq("provider", "figma")
    .eq("webhook_id", webhookId)
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();

  if (config?.passcode && safeEqual(config.passcode, passcode)) {
    return true;
  }

  // 2. Fallback to env var
  const envPasscode = process.env.FIGMA_WEBHOOK_PASSCODE;
  if (envPasscode && safeEqual(envPasscode, passcode)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Background re-extraction
// ---------------------------------------------------------------------------

/** Debounce map: projectId -> last extraction start timestamp (ms). */
const extractionDebounce = new Map<string, number>();

/** Minimum interval between re-extractions for the same project (ms). */
const DEBOUNCE_INTERVAL_MS = 60_000;

/**
 * Resolve the Figma access token for extraction.
 *
 * Currently Figma PATs are stored client-side (localStorage) only, so
 * webhook-triggered extractions rely on `FIGMA_DEFAULT_TOKEN` env var.
 *
 * When server-side per-org token storage is added, extend this function
 * to look up the org's stored token first.
 */
function resolveFigmaToken(_orgId: string): string | null {
  return process.env.FIGMA_DEFAULT_TOKEN ?? null;
}

/**
 * Run re-extraction in the background. This is fire-and-forget from the
 * webhook handler to keep the response fast.
 */
async function performBackgroundExtraction(
  projectId: string,
  orgId: string,
  fileKey: string,
  eventType: string,
  triggeredBy: string
): Promise<void> {
  const logPrefix = `[figma-webhook:extract]`;

  try {
    // Resolve Figma access token
    const accessToken = resolveFigmaToken(orgId);
    if (!accessToken) {
      console.warn(
        `${logPrefix} No Figma access token available for org ${orgId}. ` +
        `Set FIGMA_DEFAULT_TOKEN or configure an API key for this org.`
      );
      return;
    }

    // Fetch full project to get previous extraction data
    const project = await fetchProjectById(projectId);
    if (!project) {
      console.warn(`${logPrefix} Project ${projectId} not found during background extraction`);
      return;
    }

    const previousExtraction = project.extractionData as ExtractionResult | undefined;

    console.info(
      `${logPrefix} Starting re-extraction`,
      JSON.stringify({ projectId, fileKey, eventType, triggeredBy })
    );

    const startMs = Date.now();

    // Run extraction
    const newExtraction = await extractFromFigma({
      fileKey,
      accessToken,
      onProgress: (step, percent, detail) => {
        if (percent === 80 || step === "complete") {
          console.info(`${logPrefix} [${projectId}] ${step}: ${detail ?? ""}`);
        }
      },
    });

    const durationMs = Date.now() - startMs;

    // Diff against previous extraction if available
    let diffSummary = "No previous extraction to compare";
    let hasChanges = true;

    if (previousExtraction) {
      const diff = diffExtractions(previousExtraction, newExtraction);
      diffSummary = diff.summary;
      hasChanges =
        diff.tokens.added > 0 ||
        diff.tokens.removed > 0 ||
        diff.tokens.modified > 0 ||
        diff.components.added > 0 ||
        diff.components.removed > 0 ||
        diff.components.modified > 0 ||
        diff.fonts.added.length > 0 ||
        diff.fonts.removed.length > 0;
    }

    if (!hasChanges) {
      console.info(
        `${logPrefix} No changes detected`,
        JSON.stringify({ projectId, fileKey, durationMs })
      );
      return;
    }

    // Count tokens for the project record
    const tokenCount =
      newExtraction.tokens.colors.length +
      newExtraction.tokens.typography.length +
      newExtraction.tokens.spacing.length +
      newExtraction.tokens.radius.length +
      newExtraction.tokens.effects.length;

    // Update the project's extraction_data in Supabase
    const { error: updateError } = await supabase
      .from("layout_projects")
      .update({
        extraction_data: newExtraction,
        token_count: tokenCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      console.error(
        `${logPrefix} Failed to update project`,
        JSON.stringify({ projectId, error: updateError.message })
      );
      return;
    }

    console.info(
      `${logPrefix} Re-extraction complete`,
      JSON.stringify({
        projectId,
        fileKey,
        eventType,
        triggeredBy,
        durationMs,
        tokenCount,
        diff: diffSummary,
      })
    );
  } catch (err) {
    console.error(
      `${logPrefix} Background extraction failed`,
      JSON.stringify({
        projectId,
        fileKey,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Project lookup
// ---------------------------------------------------------------------------

/**
 * Look up a Layout project whose `source_url` contains the given Figma file key.
 */
async function findProjectByFileKey(fileKey: string) {
  const { data, error } = await supabase
    .from("layout_projects")
    .select("id, org_id, name, source_url")
    .ilike("source_url", `%${fileKey.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[figma-webhook] Error looking up project:", error.message);
    return null;
  }

  return data;
}

// ---------------------------------------------------------------------------
// GET — Figma endpoint verification
// ---------------------------------------------------------------------------

export async function GET() {
  return NextResponse.json(
    { status: "ok", message: "Figma webhook endpoint active" },
    { status: 200 }
  );
}

// ---------------------------------------------------------------------------
// POST — Receive webhook events
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate payload shape
  const parsed = FigmaWebhookPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[figma-webhook] Invalid payload:", parsed.error.issues);
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload: FigmaWebhookPayload = parsed.data;

  // Verify passcode (from payload or header/query)
  const headerPasscode = request.headers.get("X-Figma-Signature");
  const queryPasscode = request.nextUrl.searchParams.get("passcode");
  const passcodeToVerify =
    headerPasscode ?? queryPasscode ?? payload.passcode;

  const isValid = await verifyPasscode(passcodeToVerify, payload.webhook_id);
  if (!isValid) {
    console.warn("[figma-webhook] Passcode verification failed");
    return NextResponse.json(
      { error: "Unauthorised" },
      { status: 401 }
    );
  }

  // Handle PING — Figma sends this to verify the endpoint on registration
  if (payload.event_type === "PING") {
    console.info("[figma-webhook] Received PING for webhook:", payload.webhook_id);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  // Only process FILE_UPDATE and LIBRARY_PUBLISH events
  if (payload.event_type !== "FILE_UPDATE" && payload.event_type !== "LIBRARY_PUBLISH") {
    console.info(
      `[figma-webhook] Ignoring event type: ${payload.event_type}`
    );
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  // Look up the project by file key
  const project = await findProjectByFileKey(payload.file_key);

  if (!project) {
    console.info(
      `[figma-webhook] No project found for file key: ${payload.file_key}`
    );
    return NextResponse.json(
      { status: "ok", message: "No matching project" },
      { status: 200 }
    );
  }

  const triggeredBy = payload.triggered_by?.handle ?? "unknown";

  console.info(
    `[figma-webhook] ${payload.event_type} received`,
    JSON.stringify({
      fileKey: payload.file_key,
      fileName: payload.file_name,
      projectId: project.id,
      projectName: project.name,
      orgId: project.org_id,
      triggeredBy,
      timestamp: payload.timestamp,
    })
  );

  // Debounce: skip if a re-extraction was started within the last 60 seconds
  const lastExtraction = extractionDebounce.get(project.id);
  const now = Date.now();

  if (lastExtraction && now - lastExtraction < DEBOUNCE_INTERVAL_MS) {
    const remainingSec = Math.ceil(
      (DEBOUNCE_INTERVAL_MS - (now - lastExtraction)) / 1000
    );
    console.info(
      `[figma-webhook] Debounced re-extraction for project ${project.id} (${remainingSec}s remaining)`
    );
    return NextResponse.json(
      {
        status: "ok",
        message: `Debounced, retry in ${remainingSec}s`,
        projectId: project.id,
      },
      { status: 200 }
    );
  }

  // Mark debounce timestamp before firing background task
  extractionDebounce.set(project.id, now);

  // Fire and forget: run extraction in background so the webhook returns quickly
  performBackgroundExtraction(
    project.id,
    project.org_id,
    payload.file_key,
    payload.event_type,
    triggeredBy
  ).catch((err) => {
    console.error(
      "[figma-webhook] Unhandled error in background extraction:",
      err instanceof Error ? err.message : String(err)
    );
  });

  return NextResponse.json(
    {
      status: "ok",
      message: "Webhook received, extraction queued",
      projectId: project.id,
    },
    { status: 200 }
  );
}
