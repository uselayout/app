import { supabase } from "@/lib/supabase/client";

export type EmailType = "welcome" | "reminder" | "final_reminder";

interface LogEmailParams {
  accessRequestId: string;
  emailType: EmailType;
  fromEmail?: string;
  resendId?: string;
}

export async function logEmail({
  accessRequestId,
  emailType,
  fromEmail,
  resendId,
}: LogEmailParams): Promise<void> {
  const { error } = await supabase.from("email_log").insert({
    access_request_id: accessRequestId,
    email_type: emailType,
    from_email: fromEmail ?? null,
    resend_id: resendId ?? null,
  });
  if (error) {
    console.error("Failed to log email:", error);
  }
}

export async function getEmailTypes(
  accessRequestId: string
): Promise<EmailType[]> {
  const { data, error } = await supabase
    .from("email_log")
    .select("email_type")
    .eq("access_request_id", accessRequestId)
    .order("sent_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch email log:", error);
    return [];
  }

  return (data ?? []).map((row) => row.email_type as EmailType);
}

export async function getEmailTypesForRequests(
  requestIds: string[]
): Promise<Record<string, EmailType[]>> {
  if (requestIds.length === 0) return {};

  const { data, error } = await supabase
    .from("email_log")
    .select("access_request_id, email_type")
    .in("access_request_id", requestIds)
    .order("sent_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch email logs:", error);
    return {};
  }

  const result: Record<string, EmailType[]> = {};
  for (const row of data ?? []) {
    const id = row.access_request_id as string;
    if (!result[id]) result[id] = [];
    result[id].push(row.email_type as EmailType);
  }
  return result;
}
