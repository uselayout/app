"use client";

import { useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full bg-[var(--bg-app)] border border-[var(--studio-border)] rounded-[6px] px-3 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-strong)] transition-colors";

export function RequestAccessClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatBuilding, setWhatBuilding] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, whatBuilding, howHeard }),
      });

      const json = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok) {
        throw new Error(json.error ?? "Something went wrong");
      }

      setSubmitted(true);
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
                  Request Early Access
                </span>
                <span className="text-[12px] leading-[16px] text-[var(--text-secondary)]">
                  Private beta — we review every request
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center justify-center w-7 h-7 rounded text-[var(--text-secondary)] hover:text-white transition-colors"
              aria-label="Back to layout.design"
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
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="text-[20px]">✓</span>
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Request received
                </p>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  We&apos;ll be in touch within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={`${inputClass} h-[40px]`}
                />
                <input
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`${inputClass} h-[40px]`}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[var(--text-secondary)] px-0.5">What are you building?</label>
                  <textarea
                    rows={2}
                    placeholder='e.g. "A SaaS dashboard with a Figma design system"'
                    value={whatBuilding}
                    onChange={(e) => setWhatBuilding(e.target.value)}
                    required
                    className={`${inputClass} py-2 resize-none`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[var(--text-secondary)] px-0.5">How did you hear about us?</label>
                  <input
                    type="text"
                    placeholder='e.g. "Cursor Discord", "@username on X", "Google"'
                    value={howHeard}
                    onChange={(e) => setHowHeard(e.target.value)}
                    required
                    className={`${inputClass} h-[40px]`}
                  />
                </div>

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
                  {isLoading ? "Submitting..." : "Request Access"}
                </button>
              </form>
            )}
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
