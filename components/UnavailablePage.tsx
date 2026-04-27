import Image from "next/image";

export function UnavailablePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-app)] px-6 font-sans">
      <Image
        src="/marketing/logo-white.svg"
        alt="Layout"
        width={99}
        height={24}
        className="mb-12 opacity-60"
      />
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
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">
        Layout is briefly unavailable
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-[var(--text-muted)]">
        We&apos;re reconnecting to the database. Your session is still active.
        This usually resolves within a minute.
      </p>
      <a
        href="."
        className="mt-8 rounded-lg border border-[var(--studio-border)] px-5 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--studio-border-strong)] hover:text-[var(--text-primary)]"
      >
        Retry
      </a>
    </div>
  );
}
