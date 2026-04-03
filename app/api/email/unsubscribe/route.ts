import { NextRequest } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { addSuppression } from "@/lib/email/suppression";

function htmlPage(title: string, message: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Layout</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0C0C0E; color: #EDEDF4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { max-width: 420px; text-align: center; padding: 48px 32px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
    p { font-size: 15px; color: rgba(237,237,244,0.7); line-height: 1.6; }
    a { color: #E0E0E6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return htmlPage("Invalid link", "This unsubscribe link is invalid or expired.");
  }

  try {
    const valid = verifyUnsubscribeToken(email, token);
    if (!valid) {
      return htmlPage("Invalid link", "This unsubscribe link is invalid or expired.");
    }
  } catch {
    return htmlPage("Invalid link", "This unsubscribe link is invalid or expired.");
  }

  await addSuppression(email, "unsubscribe", "user");

  return htmlPage(
    "You've been unsubscribed",
    "You won't receive any more emails from Layout. If this was a mistake, just reply to any previous email from us."
  );
}
