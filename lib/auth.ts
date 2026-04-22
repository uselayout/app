import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordEmailHtml } from "@/lib/email/templates/reset-password";

// Startup validation. Silent fallbacks to localhost are a common reason
// sessions "randomly log out" in production — the origin check rejects any
// request whose host doesn't match `baseURL`. Fail loud here so the next
// deploy surfaces the real cause in logs instead of a mysterious logout loop.
if (process.env.NODE_ENV === "production") {
  const required = ["BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "NEXT_PUBLIC_APP_URL", "DATABASE_URL"] as const;
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(
      `[auth] MISCONFIG: the following env vars are not set — sessions WILL NOT persist: ${missing.join(", ")}`
    );
  }
}

const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  }),
  user: {
    modelName: "layout_user",
  },
  account: {
    modelName: "layout_account",
  },
  verification: {
    modelName: "layout_verification",
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } }
      : {}),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Sending password reset email to ${user.email}`);
      const result = await sendEmail({
        to: user.email,
        subject: "Reset your Layout password",
        html: resetPasswordEmailHtml(url),
      });
      console.log(`[auth] Password reset email result:`, JSON.stringify(result));
    },
  },
  session: {
    modelName: "layout_session",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    // Accept the http/https twin only in development. In production, accepting
    // both schemes invites stray CSRF edge cases where a mixed-scheme link
    // still passes the origin check.
    ...(!isProd && process.env.NEXT_PUBLIC_APP_URL
      ? [process.env.NEXT_PUBLIC_APP_URL.replace("https://", "http://"),
         process.env.NEXT_PUBLIC_APP_URL.replace("http://", "https://")]
      : []),
  ],
  advanced: {
    useSecureCookies: isProd,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isProd,
      httpOnly: true,
      path: "/",
    },
  },
});

export type Session = typeof auth.$Infer.Session;
