"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";

export function ForgotPasswordClient() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: err } = await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (err) throw new Error(err.message);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="force-dark min-h-screen bg-[#080705] relative overflow-hidden text-[var(--text-primary)]">
      {/* Aurora background */}
      <img
        src="/marketing/aurora-hero.webp"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1456px] opacity-40 pointer-events-none select-none"
      />

      {/* Card */}
      <div className="relative z-10 flex items-center justify-center px-4 min-h-screen">
        <div className="w-full max-w-[399px] bg-[var(--bg-elevated)] border border-[var(--studio-border)] rounded-[10px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)]">
          {/* Card header */}
          <div className="flex items-center justify-between h-[69px] px-5 border-b border-[var(--studio-border)]">
            <div className="flex items-center gap-[10px]">
              <div className="flex items-center justify-center w-8 h-8">
                <img
                  src="/marketing/logo-mark.svg"
                  alt=""
                  width={19}
                  height={19}
                  className="flex-shrink-0 brightness-0 invert"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold leading-[20px] text-[var(--text-primary)]">
                  Reset password
                </span>
                <span className="text-[12px] leading-[16px] text-[var(--text-secondary)]">
                  {sent ? "Check your inbox" : "Enter your email address"}
                </span>
              </div>
            </div>
            <Link
              href="/login"
              className="flex items-center justify-center w-7 h-7 rounded text-[var(--mkt-text-secondary)] hover:text-white transition-colors"
              aria-label="Back to login"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          {/* Card body */}
          <div className="flex flex-col gap-4 px-4 py-[26px]">
            {sent ? (
              <>
                <p className="text-[13px] text-[var(--text-secondary)] leading-[1.5]">
                  If an account exists for <span className="text-[var(--text-primary)]">{email}</span>, we've sent a password reset link. Check your inbox and spam folder.
                </p>
                <Link
                  href="/login"
                  className="mt-[14px] flex items-center justify-center w-full h-[40px] bg-[var(--bg-hover)] border border-[var(--studio-border-strong)] rounded-[6px] text-[12px] font-medium text-white hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Back to sign in
                </Link>
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full h-[40px] bg-[var(--bg-app)] border border-[var(--studio-border)] rounded-[6px] px-3 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-strong)] transition-colors"
                  />

                  {error && (
                    <p className="rounded-[6px] bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-[14px] w-full h-[40px] bg-[var(--bg-hover)] border border-[var(--studio-border-strong)] rounded-[6px] text-[12px] font-medium text-white hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                <p className="text-center text-[12px] text-[var(--text-secondary)]">
                  Remember your password?{" "}
                  <Link href="/login" className="text-white hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
