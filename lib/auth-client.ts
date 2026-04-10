import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

/** Request a password reset email via Better Auth's /request-password-reset endpoint */
export async function requestPasswordReset(opts: { email: string; redirectTo: string }) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${base}/api/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    return { error: { message: body.message || "Request failed" } };
  }
  return { error: null };
}

/** Reset password with a token via Better Auth's /reset-password endpoint */
export async function resetPassword(opts: { newPassword: string; token: string }) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${base}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    return { error: { message: body.message || "Request failed" } };
  }
  return { error: null };
}
