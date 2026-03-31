import Image from "next/image";

export function MaintenancePage() {
  const eta = process.env.NEXT_PUBLIC_MAINTENANCE_ETA;

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
            d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">
        We&apos;ll be right back
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-[var(--text-muted)]">
        Layout is undergoing scheduled maintenance. This won&apos;t take long.
      </p>
      {eta && (
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Estimated return: {eta}
        </p>
      )}
      {process.env.NEXT_PUBLIC_DISCORD_INVITE_URL && (
        <a
          href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 rounded-lg border border-[var(--studio-border)] px-5 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--studio-border-strong)] hover:text-[var(--text-primary)]"
        >
          Join our Discord for updates
        </a>
      )}
    </div>
  );
}
