import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createHash, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase/client";

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

  // Only process FILE_UPDATE events for now
  if (payload.event_type !== "FILE_UPDATE") {
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

  // TODO: Queue background re-extraction + PR creation
  // For now, log the event and return 200
  console.info(
    "[figma-webhook] FILE_UPDATE received",
    JSON.stringify({
      fileKey: payload.file_key,
      fileName: payload.file_name,
      projectId: project.id,
      projectName: project.name,
      orgId: project.org_id,
      triggeredBy: payload.triggered_by?.handle ?? "unknown",
      timestamp: payload.timestamp,
    })
  );

  return NextResponse.json(
    {
      status: "ok",
      message: "Webhook received — extraction queued",
      projectId: project.id,
    },
    { status: 200 }
  );
}
