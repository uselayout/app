"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";

const BETA_ACTIVE = process.env.NEXT_PUBLIC_BETA_INVITE_REQUIRED === "true";

export function SignupClient() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}

type CodeStatus = "idle" | "valid" | "invalid";

function SignupContent() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track the last code we validated to avoid redundant fetches
  const lastValidatedCode = useRef<string>("");

  const validateCode = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === lastValidatedCode.current) return;
    lastValidatedCode.current = trimmed;

    setCodeStatus("idle");

    const res = await fetch(`/api/invite/validate?code=${encodeURIComponent(trimmed)}`);
    if (!res.ok) {
      setCodeStatus("invalid");
      return;
    }
    const data = (await res.json()) as { valid: boolean; alreadyUsed: boolean; expired: boolean };
    setCodeStatus(data.valid ? "valid" : "invalid");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();

    // Server-side code re-validation before account creation
    if (BETA_ACTIVE) {
      if (!trimmedCode) {
        setError("An invite code is required to create an account.");
        return;
      }
      const res = await fetch(`/api/invite/validate?code=${encodeURIComponent(trimmedCode)}`);
      const data = res.ok
        ? ((await res.json()) as { valid: boolean; alreadyUsed: boolean; expired: boolean })
        : { valid: false, alreadyUsed: false, expired: false };

      if (!data.valid) {
        setCodeStatus("invalid");
        setError(
          data.alreadyUsed
            ? "That invite code has already been used."
            : data.expired
            ? "That invite code has expired."
            : "Invalid invite code."
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await signUp.email({
        email,
        password,
        name: name.trim() || email.split("@")[0],
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Redeem invite code and generate 3 codes for the new user
      if (trimmedCode) {
        const redeemRes = await fetch("/api/invite/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmedCode }),
        });
        if (!redeemRes.ok) {
          setError(
            "Account created but invite code could not be redeemed. Please contact support."
          );
          return;
        }
      }

      router.push("/");
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
                  Join Layout
                </span>
                <span className="text-[12px] leading-[16px] text-[var(--text-secondary)]">
                  {BETA_ACTIVE ? "Private beta — invite required" : "Create your account"}
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center justify-center w-7 h-7 rounded text-[var(--text-muted)] hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 2L14 14M14 2L2 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </div>

          {/* Card body */}
          <div className="flex flex-col gap-4 px-4 py-[26px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
              {/* Invite code */}
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder={BETA_ACTIVE ? "Invite code (required)" : "Invite code (optional)"}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeStatus("idle");
                    lastValidatedCode.current = "";
                  }}
                  onBlur={() => validateCode(code)}
                  required={BETA_ACTIVE}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full h-[40px] bg-[var(--bg-app)] border border-[var(--studio-border)] rounded-[6px] px-3 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-strong)] transition-colors font-mono tracking-wider"
                />
                {codeStatus === "valid" && (
                  <p className="text-[11px] text-emerald-400 px-1">✓ Valid invite code</p>
                )}
                {codeStatus === "invalid" && (
                  <p className="text-[11px] text-red-400 px-1">Invalid or already used</p>
                )}
              </div>

              {/* Name */}
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-[40px] bg-[var(--bg-app)] border border-[var(--studio-border)] rounded-[6px] px-3 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-strong)] transition-colors"
              />

              {/* Email */}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-[40px] bg-[var(--bg-app)] border border-[var(--studio-border)] rounded-[6px] px-3 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-strong)] transition-colors"
              />

              {/* Password */}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </form>

            {/* Links */}
            <div className="flex flex-col gap-[6px] text-center">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Already have an account?{" "}
                <Link href="/login" className="text-white hover:underline">
                  Sign in →
                </Link>
              </p>
              {BETA_ACTIVE && (
                <p className="text-[12px] text-[var(--text-secondary)]">
                  Don&apos;t have a code?{" "}
                  <Link href="/request-access" className="text-white hover:underline">
                    Request early access →
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Card footer */}
          <div className="border-t border-[var(--studio-border)] px-5 py-[10px]">
            <p className="text-[12px] leading-[16px] text-[var(--text-muted)] text-center">
              By continuing you agree to our
              <br />
              <a href="/terms" className="text-white underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-white underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
