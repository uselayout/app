"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

const BETA_ACTIVE = process.env.NEXT_PUBLIC_BETA_INVITE_REQUIRED === 'true';

export function LoginPageClient() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/studio";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/studio";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: err } = await signIn.email({ email, password });
      if (err) throw new Error(err.message);
      router.refresh();
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080705] relative overflow-hidden">
      {/* Aurora background */}
      <img
        src="/marketing/aurora-hero.webp"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1456px] opacity-40 pointer-events-none select-none"
      />

      {/* Card */}
      <div className="relative z-10 flex items-center justify-center px-4 min-h-screen">
        <div className="w-full max-w-[399px] bg-[#282826] border border-[rgba(255,255,255,0.07)] rounded-[10px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)]">
          {/* Card header */}
          <div className="flex items-center justify-between h-[69px] px-5 border-b border-[rgba(255,255,255,0.07)]">
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
                <span className="text-[14px] font-semibold leading-[20px] text-[#ededf4]">
                  Welcome to Layout
                </span>
                <span className="text-[12px] leading-[16px] text-[#99a1af]">
                  Sign in to your account
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center justify-center w-7 h-7 rounded text-[var(--mkt-text-secondary)] hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          {/* Card body */}
          <div className="flex flex-col gap-4 px-4 py-[26px]">
            {/* Social buttons — hidden during beta to prevent bypassing invite gate */}
            {!BETA_ACTIVE && (
              <>
                <div className="flex flex-col gap-[10px]">
                  <button
                    type="button"
                    onClick={() => signIn.social({ provider: "google", callbackURL: next })}
                    className="flex items-center justify-center gap-[6px] w-full h-[40px] bg-white border border-[#4a4343] rounded-[6px] text-[12px] font-medium text-[#010101] hover:bg-gray-50 transition-colors"
                  >
                    <svg width="19" height="19" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={() => signIn.social({ provider: "github", callbackURL: next })}
                    className="flex items-center justify-center gap-[6px] w-full h-[40px] bg-white border border-[#4a4343] rounded-[6px] text-[12px] font-medium text-[#010101] hover:bg-gray-50 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 98 96" fill="#010101">
                      <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                    </svg>
                    Continue with GitHub
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-[10px] py-[9px]">
                  <div className="flex-1 h-px bg-[#373735]" />
                  <span className="text-[12px] text-[#ededf4]">Or</span>
                  <div className="flex-1 h-px bg-[#373735]" />
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-[40px] bg-[#010101] border border-[rgba(255,255,255,0.07)] rounded-[6px] px-3 text-[12px] text-[#ededf4] placeholder:text-[rgba(237,237,244,0.5)] outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-[40px] bg-[#010101] border border-[rgba(255,255,255,0.07)] rounded-[6px] px-3 text-[12px] text-[#ededf4] placeholder:text-[rgba(237,237,244,0.5)] outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
              />

              <Link
                href="/forgot-password"
                className="text-[12px] text-[#99a1af] hover:text-white transition-colors self-end -mt-1"
              >
                Forgot password?
              </Link>

              {error && (
                <p className="rounded-[6px] bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-[14px] w-full h-[40px] bg-[#3c3c3c] border border-[#4a4343] rounded-[6px] text-[12px] font-medium text-white hover:bg-[#444] transition-colors disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Signup link */}
            <p className="text-center text-[12px] text-[#99a1af]">
              New to Layout?{" "}
              <Link href="/signup" className="text-white hover:underline">
                Get an invite →
              </Link>
            </p>
          </div>

          {/* Card footer */}
          <div className="border-t border-[rgba(255,255,255,0.07)] px-5 py-[10px]">
            <p className="text-[12px] leading-[16px] text-[#99999a] text-center">
              By continuing you agree to our<br />
              <a href="/terms" className="text-white underline">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="text-white underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
