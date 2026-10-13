import type { Metadata } from "next";
import Link from "next/link";
import { RequestAccessClient } from "@/components/auth/RequestAccessClient";
import { sunsetDate } from "@/lib/sunset";

export const metadata: Metadata = {
  title: "Request Early Access",
  description: "Request access to Layout's private beta.",
};

export default function RequestAccessPage() {
  const closesOn = sunsetDate();
  if (!closesOn) return <RequestAccessClient />;

  return (
    <main className="force-dark flex min-h-screen items-center justify-center bg-[var(--mkt-bg)] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-[28px] font-normal text-[var(--mkt-text-primary)]">
          We&apos;re no longer accepting new requests
        </h1>
        <p className="mt-3 text-[16px] text-[var(--mkt-text-secondary)]">
          Layout Studio closes on {closesOn}. Layout Live and the Layout CLI keep working and are free to use.
        </p>
        <Link
          href="/live"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mkt-btn-primary-bg)] px-4 py-2 text-[14px] font-medium text-[var(--mkt-btn-primary-text)] transition-opacity duration-150 hover:opacity-85"
        >
          Get Layout Live
        </Link>
      </div>
    </main>
  );
}
