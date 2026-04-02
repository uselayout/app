import { supabase } from "@/lib/supabase/client";

export type PlatformProduct = "studio" | "cli" | "figma-plugin" | "chrome-extension";

export type PlatformEventType =
  | "extraction.complete"
  | "extraction.failed"
  | "layout_md.created"
  | "variant.generated"
  | "variant.rated"
  | "component.saved"
  | "component.copied"
  | "export.bundle"
  | "export.pull"
  | "mcp.tool_call"
  | "plugin.figma.push"
  | "plugin.figma.push_tokens"
  | "plugin.figma.capture"
  | "plugin.figma.connected"
  | "plugin.chrome.connected";

/** Log a platform event — fire-and-forget, errors are logged not thrown */
export async function logEvent(
  event: PlatformEventType,
  product: PlatformProduct,
  params?: {
    userId?: string;
    orgId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("layout_platform_event").insert({
    user_id: params?.userId ?? null,
    org_id: params?.orgId ?? null,
    event,
    product,
    metadata: params?.metadata ?? {},
  });

  if (error) {
    console.error("Failed to log platform event:", error.message);
  }
}
