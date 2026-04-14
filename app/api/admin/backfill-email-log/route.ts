import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";
import type { EmailType } from "@/lib/email/log";

const SUBJECT_TO_TYPE: Record<string, EmailType> = {
  "Your Layout alpha access is ready": "welcome",
  "Your Layout access code is waiting": "reminder",
  "Last chance: your Layout access code": "final_reminder",
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  // 1. Fetch all access requests to build email→id lookup
  const { data: accessRequests, error: arError } = await supabase
    .from("access_requests")
    .select("id, email");

  if (arError || !accessRequests) {
    return NextResponse.json({ error: "Failed to fetch access requests", details: arError?.message }, { status: 500 });
  }

  const emailToRequestId = new Map<string, string>();
  for (const ar of accessRequests) {
    emailToRequestId.set((ar.email as string).toLowerCase(), ar.id as string);
  }

  // 2. Fetch existing email_log entries to avoid duplicates
  const { data: existingLogs, error: logError } = await supabase
    .from("email_log")
    .select("access_request_id, email_type, resend_id");

  if (logError) {
    return NextResponse.json({ error: "Failed to fetch email_log", details: logError.message }, { status: 500 });
  }

  const existingSet = new Set<string>();
  for (const log of existingLogs ?? []) {
    if (log.resend_id) existingSet.add(log.resend_id);
    existingSet.add(`${log.access_request_id}:${log.email_type}`);
  }

  // 3. Paginate through all Resend emails
  // SDK types: { data: { object: 'list', has_more: boolean, data: ListEmail[] }, error: null }
  interface ResendEmail {
    id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
  }

  const allEmails: ResendEmail[] = [];
  let cursor: string | undefined;
  let pages = 0;
  let lastError: string | null = null;
  const MAX_PAGES = 50;

  while (pages < MAX_PAGES) {
    const listResult = await resend.emails.list({
      limit: 100,
      ...(cursor ? { after: cursor } : {}),
    });

    if (listResult.error) {
      lastError = JSON.stringify(listResult.error);
      break;
    }

    if (!listResult.data) {
      lastError = "listResult.data is null";
      break;
    }

    const batch = listResult.data.data;
    if (!batch || batch.length === 0) break;

    allEmails.push(...batch);
    cursor = batch[batch.length - 1].id;
    pages++;

    // Use has_more from the API response
    if (!listResult.data.has_more) break;
  }

  // 4. Collect diagnostics - subject distribution
  const subjectCounts: Record<string, number> = {};
  for (const email of allEmails) {
    const subject = email.subject ?? "(no subject)";
    subjectCounts[subject] = (subjectCounts[subject] ?? 0) + 1;
  }

  // 5. Filter and match
  const toInsert: Array<{
    access_request_id: string;
    email_type: EmailType;
    sent_at: string;
    from_email: string;
    resend_id: string;
  }> = [];

  let matched = 0;
  let skipped = 0;
  let noRequestMatch = 0;

  for (const email of allEmails) {
    const emailType = SUBJECT_TO_TYPE[email.subject];
    if (!emailType) continue;

    matched++;
    const recipientEmail = email.to[0]?.toLowerCase();
    if (!recipientEmail) continue;

    const requestId = emailToRequestId.get(recipientEmail);
    if (!requestId) { noRequestMatch++; continue; }

    if (existingSet.has(email.id) || existingSet.has(`${requestId}:${emailType}`)) {
      skipped++;
      continue;
    }

    toInsert.push({
      access_request_id: requestId,
      email_type: emailType,
      sent_at: email.created_at,
      from_email: email.from,
      resend_id: email.id,
    });
  }

  // 6. Batch insert
  let inserted = 0;
  let insertError: string | null = null;
  if (toInsert.length > 0) {
    const { error: err } = await supabase.from("email_log").insert(toInsert);
    if (err) {
      insertError = err.message;
    } else {
      inserted = toInsert.length;
    }
  }

  return NextResponse.json({
    fetched: allEmails.length,
    pages,
    matched,
    inserted,
    skipped,
    noRequestMatch,
    existingLogCount: existingLogs?.length ?? 0,
    accessRequestCount: accessRequests.length,
    resendError: lastError,
    insertError,
    subjects: subjectCounts,
    sampleEmails: allEmails.slice(0, 3).map((e) => ({
      id: e.id,
      subject: e.subject,
      to: e.to,
      from: e.from,
      created_at: e.created_at,
    })),
  });
}
