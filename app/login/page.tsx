"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-[--text-muted]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[--studio-accent]"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium tracking-wide uppercase">
              SuperDuper AI Studio
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[--text-primary]">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-[--studio-border] bg-[--bg-surface] p-1">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === "signin"
                ? "bg-[--studio-accent] text-[--text-on-accent]"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-[--studio-accent] text-[--text-on-accent]"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <Input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-[--studio-border-strong] bg-[--bg-surface] text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--studio-border-focus]"
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-[--studio-border-strong] bg-[--bg-surface] text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--studio-border-focus]"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="border-[--studio-border-strong] bg-[--bg-surface] text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--studio-border-focus]"
          />

          {error && (
            <p className="text-xs text-[--status-error]">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 w-full bg-[--studio-accent] text-[--text-on-accent] hover:bg-[--studio-accent-hover] disabled:opacity-40"
          >
            {isLoading
              ? mode === "signin" ? "Signing in..." : "Creating account..."
              : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
