"use client";

import { useState, useEffect, useRef } from "react";
import { SENDER_OPTIONS, OUTREACH_SENDER_OPTIONS } from "@/lib/email/senders";
import { EMAIL_TOKENS } from "@/lib/email/tokens";

interface RecipientData {
  segments: {
    all_users: { count: number; label: string };
    approved_not_signed_up: { count: number; label: string };
  };
  users: Array<{ email: string; name: string; source: string }>;
}

type Segment = "all_users" | "approved_not_signed_up" | "individual" | "outreach";

interface OutreachRecipient {
  email: string;
  name: string;
  suppressed?: boolean;
}

/** Parse bulk-pasted text into email + name pairs */
function parseBulkEmails(text: string): OutreachRecipient[] {
  const results: OutreachRecipient[] = [];
  const seen = new Set<string>();

  // Split on newlines, commas (but not within angle brackets), or semicolons
  const lines = text.split(/[\n;]+/).flatMap((l) => {
    // Only split on commas if there's no angle bracket pattern
    if (l.includes("<") && l.includes(">")) return [l];
    return l.split(",");
  });

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    let email = "";
    let name = "";

    // Format: "First Last <email@example.com>"
    const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+@[^>]+)>\s*$/);
    if (angleMatch) {
      name = angleMatch[1].replace(/^["']|["']$/g, "").trim();
      email = angleMatch[2].trim().toLowerCase();
    } else {
      // Format: just an email
      const emailMatch = trimmed.match(/[\w.+-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        email = emailMatch[0].toLowerCase();
        // Try to extract name from before the email
        const before = trimmed.slice(0, trimmed.indexOf(emailMatch[0])).replace(/[,;:\s]+$/, "").trim();
        if (before && !before.includes("@")) {
          name = before;
        }
      }
    }

    if (!email) continue;
    if (seen.has(email)) continue;
    seen.add(email);

    // Guess name from email if not provided
    if (!name) {
      const local = email.split("@")[0];
      const parts = local.split(/[._-]/);
      name = parts
        .filter((p) => p.length > 1)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    }

    results.push({ email, name });
  }

  return results;
}

interface Props {
  toast: (msg: string, type?: "success" | "error") => void;
}

/**
 * Convert plain text with basic formatting to styled HTML matching the Layout email templates.
 * Supports: blank lines (paragraphs), - lists, **bold**, ## headings, URLs auto-linked.
 */
function textToEmailHtml(text: string): string {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let currentParagraph: string[] = [];
  let inList = false;
  const listItems: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(" ");
      if (content.trim()) {
        blocks.push(`<p style="margin:0 0 16px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;">${formatInline(content)}</p>`);
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const items = listItems.map((item) =>
        `<li style="margin-bottom:10px;">${formatInline(item)}</li>`
      ).join("\n");
      blocks.push(`<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;">\n${items}\n</ul>`);
      listItems.length = 0;
      inList = false;
    }
  };

  function formatInline(text: string): string {
    // Bold: **text**
    let result = text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#EDEDF4;">$1</strong>');
    // Markdown links: [text](url)
    result = result.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" style="color:#e4f222;text-decoration:underline;">$1</a>'
    );
    // Auto-link bare URLs (only those not already wrapped in an href)
    result = result.replace(
      /(?<!href=")(https?:\/\/[^\s<]+)/g,
      '<a href="$1" style="color:#e4f222;text-decoration:underline;">$1</a>'
    );
    return result;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Blank line: flush current block
    if (trimmed === "") {
      if (inList) flushList();
      flushParagraph();
      continue;
    }

    // Heading: ## text
    if (trimmed.startsWith("## ")) {
      if (inList) flushList();
      flushParagraph();
      blocks.push(`<p style="margin:24px 0 8px;font-size:15px;font-weight:600;color:#EDEDF4;">${formatInline(trimmed.slice(3))}</p>`);
      continue;
    }

    // List item: - text
    if (trimmed.startsWith("- ")) {
      flushParagraph();
      inList = true;
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Continuation of list or paragraph
    if (inList) {
      flushList();
    }
    currentParagraph.push(trimmed);
  }

  if (inList) flushList();
  flushParagraph();

  return blocks.join("\n\n");
}

export function EmailTab({ toast }: Props) {
  const [recipients, setRecipients] = useState<RecipientData | null>(null);
  const [segment, setSegment] = useState<Segment>("all_users");
  const [individualEmails, setIndividualEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [fromEmail, setFromEmail] = useState(Object.keys(SENDER_OPTIONS)[0]);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ total: number; sent: number; failed: number; current: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ email: string; name: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [outreachRecipients, setOutreachRecipients] = useState<OutreachRecipient[]>([]);
  const [bulkPasteText, setBulkPasteText] = useState("");
  const [checkingSuppression, setCheckingSuppression] = useState(false);

  useEffect(() => {
    fetch("/api/admin/email/recipients")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: RecipientData | null) => {
        if (data) setRecipients(data);
      })
      .catch(() => {});
  }, []);

  const activeOutreach = outreachRecipients.filter((r) => !r.suppressed);
  const suppressedCount = outreachRecipients.filter((r) => r.suppressed).length;

  const recipientCount =
    segment === "all_users"
      ? recipients?.segments.all_users.count ?? 0
      : segment === "approved_not_signed_up"
        ? recipients?.segments.approved_not_signed_up.count ?? 0
        : segment === "outreach"
          ? activeOutreach.length
          : individualEmails.length;

  const canSend = subject.trim() && bodyText.trim() && recipientCount > 0 && !sending;

  const insertTokenIntoBody = (token: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBodyText((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? bodyText.length;
    const end = el.selectionEnd ?? bodyText.length;
    const next = bodyText.slice(0, start) + token + bodyText.slice(end);
    setBodyText(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + token.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const handleAddEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && trimmed.includes("@") && !individualEmails.includes(trimmed)) {
      setIndividualEmails([...individualEmails, trimmed]);
    }
    setEmailInput("");
    setSuggestions([]);
  };

  const handleEmailInputChange = (value: string) => {
    setEmailInput(value);
    if (value.length >= 2 && recipients) {
      const lower = value.toLowerCase();
      setSuggestions(
        recipients.users
          .filter(
            (u) =>
              (u.email.toLowerCase().includes(lower) || u.name.toLowerCase().includes(lower)) &&
              !individualEmails.includes(u.email.toLowerCase())
          )
          .slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  };

  const handlePreview = async () => {
    const bodyHtml = textToEmailHtml(bodyText);
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bodyHtml }),
    });
    const json = await res.json();
    if (res.ok) {
      setPreviewHtml(json.html);
    } else {
      toast(json.error ?? "Preview failed", "error");
    }
  };

  const handleSend = async () => {
    setConfirming(false);
    setSending(true);
    setProgress(null);

    try {
      const res = await fetch("/api/admin/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          bodyHtml: textToEmailHtml(bodyText),
          segment,
          individualEmails: segment === "individual" ? individualEmails : undefined,
          outreachRecipients: segment === "outreach" ? activeOutreach : undefined,
          fromEmail,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast(json?.error ?? "Broadcast failed", "error");
        setSending(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "progress") {
                setProgress(event);
              } else if (event.type === "done") {
                toast(`Sent ${event.sent} of ${event.total} emails${event.failed > 0 ? ` (${event.failed} failed)` : ""}`, "success");
              }
            } catch { /* skip malformed events */ }
          }
        }
      }
    } catch {
      toast("Broadcast failed", "error");
    } finally {
      setSending(false);
    }
  };

  const activeSenders = segment === "outreach" ? OUTREACH_SENDER_OPTIONS : SENDER_OPTIONS;
  const senderKeys = Object.keys(activeSenders);

  // Switch to outreach sender when segment changes
  useEffect(() => {
    if (segment === "outreach" && !Object.keys(OUTREACH_SENDER_OPTIONS).includes(fromEmail)) {
      setFromEmail(Object.keys(OUTREACH_SENDER_OPTIONS)[0]);
    } else if (segment !== "outreach" && !Object.keys(SENDER_OPTIONS).includes(fromEmail)) {
      setFromEmail(Object.keys(SENDER_OPTIONS)[0]);
    }
  }, [segment, fromEmail]);

  const handleParseBulk = async () => {
    const parsed = parseBulkEmails(bulkPasteText);
    if (parsed.length === 0) {
      toast("No valid emails found", "error");
      return;
    }

    // Check suppressions
    setCheckingSuppression(true);
    try {
      const res = await fetch("/api/admin/email/check-suppression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parsed.map((r) => r.email) }),
      });
      if (res.ok) {
        const { suppressed } = await res.json() as { suppressed: string[] };
        const suppressedSet = new Set(suppressed);
        const withSuppression = parsed.map((r) => ({
          ...r,
          suppressed: suppressedSet.has(r.email),
        }));
        setOutreachRecipients(withSuppression);
      } else {
        setOutreachRecipients(parsed);
      }
    } catch {
      setOutreachRecipients(parsed);
    } finally {
      setCheckingSuppression(false);
    }
    setBulkPasteText("");
  };

  return (
    <div className="space-y-6">
      {/* Audience Picker */}
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Audience
        </h3>
        <div className="flex gap-3">
          {[
            { key: "all_users" as Segment, label: "All signed-up users", count: recipients?.segments.all_users.count },
            { key: "approved_not_signed_up" as Segment, label: "Approved (not signed up)", count: recipients?.segments.approved_not_signed_up.count },
            { key: "individual" as Segment, label: "Individual recipients", count: segment === "individual" ? individualEmails.length : undefined },
            { key: "outreach" as Segment, label: "Cold outreach", count: segment === "outreach" ? activeOutreach.length : undefined },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSegment(opt.key)}
              className="flex-1 rounded-lg p-3 text-left transition-all text-sm"
              style={{
                background: segment === opt.key ? "var(--bg-elevated)" : "var(--bg-panel)",
                border: `1px solid ${segment === opt.key ? "var(--studio-border-strong)" : "var(--studio-border)"}`,
                color: segment === opt.key ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <div className="font-medium">{opt.label}</div>
              {opt.count !== undefined && (
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {opt.count} recipient{opt.count !== 1 ? "s" : ""}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Individual email picker */}
        {segment === "individual" && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {individualEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--studio-border)" }}
                >
                  {email}
                  <button
                    onClick={() => setIndividualEmails(individualEmails.filter((e) => e !== email))}
                    className="ml-0.5 hover:opacity-70"
                    style={{ color: "var(--text-muted)" }}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type email to add..."
                value={emailInput}
                onChange={(e) => handleEmailInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && emailInput) {
                    e.preventDefault();
                    handleAddEmail(emailInput);
                  }
                }}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--studio-border)",
                  color: "var(--text-primary)",
                }}
              />
              {suggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-md overflow-hidden z-10"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--studio-border)" }}
                >
                  {suggestions.map((s) => (
                    <button
                      key={s.email}
                      onClick={() => handleAddEmail(s.email)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {s.name ? `${s.name} — ` : ""}{s.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Outreach bulk paste */}
        {segment === "outreach" && (
          <div className="space-y-3">
            {outreachRecipients.length === 0 ? (
              <div className="space-y-2">
                <textarea
                  value={bulkPasteText}
                  onChange={(e) => setBulkPasteText(e.target.value)}
                  placeholder={"Paste emails here (one per line):\n\nname@example.com\nFirst Last <email@example.com>\nFirst, email@example.com"}
                  rows={6}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none resize-y font-mono"
                  style={{
                    background: "var(--bg-panel)",
                    border: "1px solid var(--studio-border)",
                    color: "var(--text-primary)",
                    lineHeight: "1.6",
                  }}
                />
                <button
                  onClick={handleParseBulk}
                  disabled={!bulkPasteText.trim() || checkingSuppression}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: "var(--studio-accent)",
                    color: "var(--text-on-accent)",
                    opacity: !bulkPasteText.trim() || checkingSuppression ? 0.5 : 1,
                  }}
                >
                  {checkingSuppression ? "Checking..." : "Parse emails"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {activeOutreach.length} recipient{activeOutreach.length !== 1 ? "s" : ""}
                    {suppressedCount > 0 && (
                      <span style={{ color: "#f87171" }}> ({suppressedCount} suppressed)</span>
                    )}
                  </p>
                  <button
                    onClick={() => setOutreachRecipients([])}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Clear all
                  </button>
                </div>
                <div
                  className="rounded-md overflow-y-auto"
                  style={{ maxHeight: 200, border: "1px solid var(--studio-border)" }}
                >
                  {outreachRecipients.map((r, i) => (
                    <div
                      key={r.email}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs"
                      style={{
                        background: i % 2 === 0 ? "var(--bg-app)" : "var(--bg-surface)",
                        opacity: r.suppressed ? 0.4 : 1,
                        textDecoration: r.suppressed ? "line-through" : "none",
                      }}
                    >
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => {
                          const updated = [...outreachRecipients];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setOutreachRecipients(updated);
                        }}
                        className="w-32 px-1.5 py-0.5 rounded outline-none"
                        style={{ background: "transparent", color: "var(--text-primary)", border: "1px solid transparent" }}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--studio-border)"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "transparent"; }}
                      />
                      <span className="flex-1 font-mono" style={{ color: "var(--text-secondary)" }}>{r.email}</span>
                      {r.suppressed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                          Unsubscribed
                        </span>
                      )}
                      <button
                        onClick={() => setOutreachRecipients(outreachRecipients.filter((_, j) => j !== i))}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100"
                        style={{ color: "var(--text-muted)" }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compose */}
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Compose
        </h3>

        {/* Sender */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>From</label>
            <select
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--studio-border)",
                color: "var(--text-primary)",
              }}
            >
              {senderKeys.map((key) => (
                <option key={key} value={key}>{activeSenders[key]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line"
            className="w-full px-3 py-2 rounded-md text-sm outline-none"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Message Body */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Message</label>
          <textarea
            ref={bodyRef}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder={"Write your message here. Basic formatting supported:\n\nBlank lines create new paragraphs\n- Dashes create bullet lists\n**Bold text** for emphasis\n## Headings for sections\nURLs are auto-linked\n[link text](https://example.com) for named links"}
            rows={12}
            className="w-full px-3 py-2 rounded-md text-sm outline-none resize-y"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
              lineHeight: "1.6",
            }}
          />
          <div
            className="mt-2 flex items-center gap-2 flex-wrap text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <span>Insert:</span>
            {EMAIL_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => insertTokenIntoBody(token)}
                className="px-2 py-0.5 rounded-md font-mono transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--studio-border)",
                  color: "var(--text-secondary)",
                }}
              >
                {token}
              </button>
            ))}
            <span>replaced per recipient before sending.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={!bodyText.trim()}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-secondary)",
              opacity: !bodyText.trim() ? 0.5 : 1,
            }}
          >
            Preview
          </button>
          <button
            onClick={() => setConfirming(true)}
            disabled={!canSend}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              background: "var(--studio-accent)",
              color: "var(--text-on-accent)",
              opacity: !canSend ? 0.5 : 1,
            }}
          >
            Send to {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
          </button>
        </div>

        {/* Progress */}
        {sending && progress && (
          <div className="space-y-2">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--bg-panel)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  background: "var(--studio-accent)",
                  width: `${Math.round(((progress.sent + progress.failed) / progress.total) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Sent {progress.sent} of {progress.total}
              {progress.failed > 0 && ` (${progress.failed} failed)`}
              {progress.current && ` — ${progress.current}`}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="rounded-xl p-6 max-w-sm w-full mx-4 space-y-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
          >
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Send broadcast?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              This will send <strong>{recipientCount}</strong> {segment === "outreach" ? "outreach" : ""} email{recipientCount !== 1 ? "s" : ""} with
              subject &quot;{subject}&quot; from {activeSenders[fromEmail] ?? fromEmail}.
              {segment === "outreach" && suppressedCount > 0 && (
                <><br /><span style={{ color: "#fbbf24" }}>{suppressedCount} suppressed email{suppressedCount !== 1 ? "s" : ""} will be skipped.</span></>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 rounded-md text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: "var(--studio-accent)", color: "var(--text-on-accent)" }}
              >
                Send {recipientCount} email{recipientCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="rounded-xl overflow-hidden max-w-2xl w-full mx-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--studio-border)" }}>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Email Preview</span>
              <button
                onClick={() => setPreviewHtml(null)}
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Close
              </button>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="w-full border-0"
              style={{ height: "500px", background: "#0C0C0E" }}
              title="Email preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
