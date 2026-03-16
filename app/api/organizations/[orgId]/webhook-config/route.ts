import { NextResponse } from "next/server";
import { z } from "zod";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { supabase } from "@/lib/supabase/client";

const ENCRYPTION_KEY = process.env.WEBHOOK_ENCRYPTION_KEY;

function encryptToken(token: string): string {
  if (!ENCRYPTION_KEY) {
    console.warn("[webhook-config] WEBHOOK_ENCRYPTION_KEY not set — storing token unencrypted");
    return token;
  }
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptToken(encrypted: string): string {
  if (!ENCRYPTION_KEY) {
    return encrypted;
  }
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    // Not an encrypted value (stored before encryption was enabled)
    return encrypted;
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}

const UpsertSchema = z.object({
  provider: z.enum(["figma"]),
  passcode: z.string().min(1),
  githubOwner: z.string().optional(),
  githubRepo: z.string().optional(),
  githubBranch: z.string().optional(),
  githubToken: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "manageApiKeys");
  if (authResult instanceof NextResponse) return authResult;

  const { data, error } = await supabase
    .from("layout_webhook_config")
    .select("id, provider, webhook_id, passcode, github_owner, github_repo, github_branch, github_token_encrypted, enabled, created_at, updated_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch webhook configs" },
      { status: 500 }
    );
  }

  // Strip the raw token — return only whether it's set
  const sanitised = (data ?? []).map((row: Record<string, unknown>) => {
    const { github_token_encrypted, ...rest } = row;
    return { ...rest, hasGithubToken: !!github_token_encrypted };
  });

  return NextResponse.json(sanitised);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "manageApiKeys");
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { provider, passcode, githubOwner, githubRepo, githubBranch, githubToken } = parsed.data;
  const now = new Date().toISOString();

  // Check for existing config for this org + provider
  const { data: existing } = await supabase
    .from("layout_webhook_config")
    .select("id")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .maybeSingle();

  const row: Record<string, unknown> = {
    org_id: orgId,
    provider,
    passcode,
    github_owner: githubOwner ?? null,
    github_repo: githubRepo ?? null,
    github_branch: githubBranch ?? "main",
    github_token_encrypted: githubToken ? encryptToken(githubToken) : null,
    enabled: true,
    updated_at: now,
  };

  if (existing?.id) {
    // Update
    const { error } = await supabase
      .from("layout_webhook_config")
      .update(row)
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update webhook config" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: existing.id, updated: true });
  }

  // Insert
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("layout_webhook_config")
    .insert({ ...row, id, created_at: now });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create webhook config" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id, created: true }, { status: 201 });
}
