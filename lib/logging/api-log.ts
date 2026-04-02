import { supabase } from "@/lib/supabase/client";

/** Strip API key patterns and truncate error messages before logging */
function sanitiseErrorMessage(msg: string | undefined): string | null {
  if (!msg) return null;
  let sanitised = msg
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, "sk-ant-***")
    .replace(/figd_[a-zA-Z0-9_-]+/g, "figd_***")
    .replace(/AIza[a-zA-Z0-9_-]+/g, "AIza***")
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-***");
  if (sanitised.length > 200) sanitised = sanitised.slice(0, 200) + "...";
  return sanitised;
}

/** Log an API request — fire-and-forget, errors are logged not thrown */
export async function logApiCall(params: {
  userId?: string;
  endpoint: string;
  method?: string;
  statusCode: number;
  durationMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("layout_api_log").insert({
    user_id: params.userId ?? null,
    endpoint: params.endpoint,
    method: params.method ?? "POST",
    status_code: params.statusCode,
    duration_ms: params.durationMs ?? null,
    error_message: sanitiseErrorMessage(params.errorMessage),
    metadata: params.metadata ?? null,
  });

  if (error) {
    console.error("Failed to log API call:", error.message);
  }
}
