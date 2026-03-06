"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { error: err } = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await signIn.email({ email, password });
        if (err) throw new Error(err.message);
      }
      router.refresh();
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Back link */}
      <div className="px-6 pt-6">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          superduperui.com
        </a>
      </div>

      <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo + heading */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-indigo-600">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-semibold tracking-widest uppercase text-gray-900">
                SuperDuper
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">
              {mode === "signin" ? "Welcome back." : "Get started."}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {mode === "signin"
                ? "Sign in to your AI Studio account."
                : "Create your account — it's free."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex rounded-2xl border border-black/[0.08] bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
                mode === "signin"
                  ? "bg-white text-[#0a0a0a] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "bg-white text-[#0a0a0a] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-black/[0.12] bg-white px-4 py-3 text-sm text-[#0a0a0a] placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-black/[0.12] bg-white px-4 py-3 text-sm text-[#0a0a0a] placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-2xl border border-black/[0.12] bg-white px-4 py-3 text-sm text-[#0a0a0a] placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading
                ? mode === "signin" ? "Signing in…" : "Creating account…"
                : mode === "signin" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            {mode === "signin" ? (
              <>No account?{" "}
                <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-indigo-600 hover:underline font-medium">Sign up free</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-indigo-600 hover:underline font-medium">Sign in</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
