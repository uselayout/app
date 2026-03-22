import { createClient } from "@supabase/supabase-js";

// Fallback values prevent build-time crash; real values are used at runtime.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";

// Server-side: use service_role key (bypasses RLS, never exposed to browser).
// Falls back to anon key for backwards compatibility during migration.
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "placeholder";

export const supabase = createClient(url, key);
