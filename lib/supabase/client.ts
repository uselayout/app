import { createClient } from "@supabase/supabase-js";

// Fallback values prevent build-time crash; real values are used at runtime.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(url, key);
