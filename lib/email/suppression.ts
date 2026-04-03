import { supabase } from "@/lib/supabase/client";

export type SuppressionReason = "unsubscribe" | "bounce" | "complaint" | "manual";
export type SuppressionSource = "user" | "webhook" | "admin";

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const { count } = await supabase
    .from("email_suppression")
    .select("*", { count: "exact", head: true })
    .eq("email", email.toLowerCase());
  return (count ?? 0) > 0;
}

export async function getSuppressedEmails(
  emails: string[]
): Promise<Set<string>> {
  if (emails.length === 0) return new Set();

  const lower = emails.map((e) => e.toLowerCase());
  const { data, error } = await supabase
    .from("email_suppression")
    .select("email")
    .in("email", lower);

  if (error) {
    console.error("Failed to check suppressions:", error);
    return new Set();
  }

  return new Set((data ?? []).map((r) => r.email as string));
}

export async function addSuppression(
  email: string,
  reason: SuppressionReason,
  source: SuppressionSource
): Promise<void> {
  const { error } = await supabase
    .from("email_suppression")
    .upsert(
      { email: email.toLowerCase(), reason, source },
      { onConflict: "email" }
    );

  if (error) {
    console.error("Failed to add suppression:", error);
  }
}

export async function removeSuppression(email: string): Promise<void> {
  const { error } = await supabase
    .from("email_suppression")
    .delete()
    .eq("email", email.toLowerCase());

  if (error) {
    console.error("Failed to remove suppression:", error);
  }
}
