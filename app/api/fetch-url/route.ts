import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";

const RequestSchema = z.object({
  url: z.string().url(),
});

const MAX_CONTENT_LENGTH = 40_000; // 40KB — stays within 50KB contextFile limit
const FETCH_TIMEOUT = 10_000; // 10s

/**
 * POST /api/fetch-url
 * Fetches a URL and returns its text content for use as AI context.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { url } = parsed.data;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LayoutBot/1.0)",
        "Accept": "text/html,application/xhtml+xml,text/plain",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const title = extractTitle(html);
    const content = htmlToText(html);
    const truncated = content.slice(0, MAX_CONTENT_LENGTH);

    const hostname = new URL(url).hostname.replace("www.", "");

    return NextResponse.json({
      name: title || hostname,
      content: truncated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// Lightweight HTML-to-text (no external deps)
// ---------------------------------------------------------------------------

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim().replace(/\s+/g, " ") : "";
}

function htmlToText(html: string): string {
  let text = html;

  // Try to extract main content area
  const mainMatch = text.match(/<main[\s>][\s\S]*?<\/main>/i);
  const articleMatch = text.match(/<article[\s>][\s\S]*?<\/article>/i);
  if (mainMatch) {
    text = mainMatch[0];
  } else if (articleMatch) {
    text = articleMatch[0];
  } else {
    // Fall back to body
    const bodyMatch = text.match(/<body[\s>][\s\S]*?<\/body>/i);
    if (bodyMatch) text = bodyMatch[0];
  }

  // Strip tags that contain non-content
  text = text.replace(/<script[\s>][\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s>][\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[\s>][\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[\s>][\s\S]*?<\/footer>/gi, "");
  text = text.replace(/<header[\s>][\s\S]*?<\/header>/gi, "");
  text = text.replace(/<svg[\s>][\s\S]*?<\/svg>/gi, "");
  text = text.replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, "");

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
