"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-app)] font-sans">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-panel)]">
        <svg
          className="h-8 w-8 text-[var(--studio-accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-[var(--text-muted)]">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
          Digest: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-[var(--studio-accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--studio-accent-hover)]"
      >
        Try again
      </button>
    </div>
  );
}
