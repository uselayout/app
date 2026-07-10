/**
 * Email deliverability audit.
 *
 * Reads every logged email from `email_log`, queries the Resend API for each
 * `resend_id` to get its `last_event` (delivered / bounced / complained /
 * opened / clicked ...), cross-references who actually signed up
 * (`layout_user`), and prints a breakdown that answers the real question:
 *
 *   Of the people who never signed up, how many emails BOUNCED or never
 *   delivered (a real deliverability problem) vs DELIVERED-but-ignored
 *   (not a deliverability problem)?
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=re_... \
 *     npx tsx scripts/email-deliverability.ts [--type welcome] [--csv out.csv] [--limit N]
 *
 * IMPORTANT: point SUPABASE_URL at the PRODUCTION Supabase (that's where the
 * real invites live). The script prints the host it is hitting so you can
 * confirm before it runs. RESEND_API_KEY is the same for every environment.
 *
 * --type   Filter by email type (welcome | reminder | final_reminder | broadcast).
 *          Omit to audit all. Default: welcome,reminder,final_reminder (the invites).
 * --csv    Write a per-recipient CSV (email, type, last_event, signed_up, sent_at).
 * --limit  Cap how many emails to check (useful for a quick dry run).
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

// ---- arg parsing ----------------------------------------------------------
function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const typeArg = argValue("--type");
const csvPath = argValue("--csv");
const limitArg = argValue("--limit");
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const types = typeArg
  ? [typeArg]
  : ["welcome", "reminder", "final_reminder"]; // the invite lifecycle

// ---- guards ---------------------------------------------------------------
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "  Set them to the PRODUCTION Supabase where the invites live."
  );
  process.exit(1);
}
if (!RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY (re_...). Get it from resend.com > API Keys.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// last_event buckets we care about
type Bucket =
  | "opened"
  | "clicked"
  | "delivered"
  | "sent"
  | "delivery_delayed"
  | "bounced"
  | "complained"
  | "queued"
  | "canceled"
  | "unknown"
  | "not_found"
  | "error";

interface Row {
  resend_id: string;
  email_type: string;
  sent_at: string | null;
  recipient_email: string | null; // only set for broadcasts in the log
}

interface Result extends Row {
  to: string;
  last_event: Bucket;
  signed_up: boolean;
}

// ---- helpers --------------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch one email's status from Resend, retrying on 429 rate limits. */
async function fetchResend(id: string): Promise<{ to: string; last_event: Bucket }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.resend.com/emails/${id}`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    if (res.status === 429) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (res.status === 404) return { to: "", last_event: "not_found" };
    if (!res.ok) return { to: "", last_event: "error" };
    const data = (await res.json()) as {
      to?: string[] | string;
      last_event?: string;
    };
    const to = Array.isArray(data.to) ? data.to[0] : data.to || "";
    return { to, last_event: (data.last_event as Bucket) || "unknown" };
  }
  return { to: "", last_event: "error" };
}

/** Load every email address that has a user account (i.e. signed up). */
async function loadSignups(): Promise<Set<string>> {
  const emails = new Set<string>();
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from("layout_user")
      .select("email")
      .range(from, from + page - 1);
    if (error) {
      console.warn("Could not read layout_user (signups unknown):", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    for (const r of data) if (r.email) emails.add(String(r.email).toLowerCase());
    if (data.length < page) break;
    from += page;
  }
  return emails;
}

/** Load all logged emails with a resend_id, for the requested types. */
async function loadEmailLog(): Promise<Row[]> {
  const rows: Row[] = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from("email_log")
      .select("resend_id, email_type, sent_at, recipient_email")
      .in("email_type", types)
      .not("resend_id", "is", null)
      .order("sent_at", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw new Error(`email_log read failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as Row[]));
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

// ---- main -----------------------------------------------------------------
async function main() {
  const host = (() => {
    try {
      return new URL(SUPABASE_URL).host;
    } catch {
      return SUPABASE_URL;
    }
  })();
  console.log(`\nSupabase:  ${host}`);
  console.log(`Types:     ${types.join(", ")}`);
  console.log(`Resend:    key ...${RESEND_API_KEY.slice(-4)}\n`);

  const [signups, logRows] = await Promise.all([loadSignups(), loadEmailLog()]);
  console.log(`Signed-up accounts: ${signups.size}`);
  console.log(`Logged emails:      ${logRows.length}`);

  const toCheck = logRows.slice(0, limit);
  if (toCheck.length < logRows.length) {
    console.log(`(checking first ${toCheck.length} due to --limit)`);
  }
  console.log(`\nQuerying Resend (throttled ~2/sec, ~${Math.ceil(toCheck.length / 2)}s)...\n`);

  const results: Result[] = [];
  for (let i = 0; i < toCheck.length; i++) {
    const row = toCheck[i];
    const { to, last_event } = await fetchResend(row.resend_id);
    const recipient = (row.recipient_email || to || "").toLowerCase();
    results.push({
      ...row,
      to: recipient,
      last_event,
      signed_up: recipient ? signups.has(recipient) : false,
    });
    if ((i + 1) % 25 === 0 || i === toCheck.length - 1) {
      process.stdout.write(`  ${i + 1}/${toCheck.length}\r`);
    }
    await sleep(500); // ~2 req/sec
  }
  console.log("\n");

  // ---- aggregate ----------------------------------------------------------
  const tally = (rs: Result[]) => {
    const t: Record<string, number> = {};
    for (const r of rs) t[r.last_event] = (t[r.last_event] || 0) + 1;
    return t;
  };
  const pct = (n: number, d: number) => (d ? ((n / d) * 100).toFixed(1) : "0.0");

  // De-dupe to one row per recipient (latest event wins) so counts = people,
  // not sends. Priority: opened/clicked > delivered > sent > problem states.
  const rank: Record<string, number> = {
    opened: 6, clicked: 6, delivered: 5, sent: 4, delivery_delayed: 3,
    queued: 2, bounced: 1, complained: 1, canceled: 0, unknown: 0,
    not_found: 0, error: 0,
  };
  const byPerson = new Map<string, Result>();
  for (const r of results) {
    if (!r.to) continue;
    const prev = byPerson.get(r.to);
    if (!prev || (rank[r.last_event] ?? 0) > (rank[prev.last_event] ?? 0)) {
      byPerson.set(r.to, r);
    }
  }
  const people = [...byPerson.values()];
  const nonSignups = people.filter((p) => !p.signed_up);

  const reached = (r: Result) =>
    ["opened", "clicked", "delivered"].includes(r.last_event);
  const failed = (r: Result) =>
    ["bounced", "not_found"].includes(r.last_event);

  console.log("=".repeat(60));
  console.log("ALL SENDS (by last_event)");
  console.log("=".repeat(60));
  const allT = tally(results);
  for (const [k, v] of Object.entries(allT).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(18)} ${String(v).padStart(5)}  ${pct(v, results.length)}%`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`UNIQUE RECIPIENTS: ${people.length}`);
  console.log("=".repeat(60));
  const reachedN = people.filter(reached).length;
  const failedN = people.filter(failed).length;
  const complaintN = people.filter((p) => p.last_event === "complained").length;
  console.log(`  Reached inbox (delivered/opened): ${reachedN}  ${pct(reachedN, people.length)}%`);
  console.log(`  Failed (bounced/not-found):       ${failedN}  ${pct(failedN, people.length)}%`);
  console.log(`  Spam complaints:                  ${complaintN}  ${pct(complaintN, people.length)}%`);

  console.log("\n" + "=".repeat(60));
  console.log(`NON-SIGNUPS: ${nonSignups.length}  <-- the people you want to re-email`);
  console.log("=".repeat(60));
  const nsReached = nonSignups.filter(reached).length;
  const nsFailed = nonSignups.filter(failed).length;
  const nsOpened = nonSignups.filter((p) =>
    ["opened", "clicked"].includes(p.last_event)
  ).length;
  console.log(`  Delivered but ignored (reached, no signup): ${nsReached}  ${pct(nsReached, nonSignups.length)}%`);
  console.log(`    ...of which we KNOW they opened it:        ${nsOpened}`);
  console.log(`  Never arrived (bounced/not-found):          ${nsFailed}  ${pct(nsFailed, nonSignups.length)}%`);
  console.log(`\n  >> ${nsReached} landed fine and were ignored. ${nsFailed} never got through.`);
  console.log(`  >> Re-emailing the ${nsFailed} bounced addresses is pointless (bad addresses).`);

  // ---- bad-address / complaint lists -------------------------------------
  const bad = nonSignups.filter((p) => failed(p) || p.last_event === "complained");
  if (bad.length) {
    console.log("\n" + "-".repeat(60));
    console.log("DO NOT RE-EMAIL (bounced / not-found / complained):");
    console.log("-".repeat(60));
    for (const p of bad) console.log(`  ${p.last_event.padEnd(12)} ${p.to}`);
  }

  // ---- CSV ---------------------------------------------------------------
  if (csvPath) {
    const header = "email,email_type,last_event,reached,signed_up,sent_at\n";
    const body = people
      .map(
        (p) =>
          `${p.to},${p.email_type},${p.last_event},${reached(p)},${p.signed_up},${p.sent_at ?? ""}`
      )
      .join("\n");
    writeFileSync(csvPath, header + body + "\n");
    console.log(`\nCSV written: ${csvPath} (${people.length} recipients)`);
  }

  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
