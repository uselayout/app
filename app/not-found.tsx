import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-app)] font-sans">
      <Image
        src="/marketing/logo-white.svg"
        alt="Layout"
        width={120}
        height={32}
        className="mb-12 opacity-80"
      />
      <h1 className="text-[120px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
        404
      </h1>
      <p className="mt-4 text-lg text-[var(--text-secondary)]">
        Page not found
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-[var(--studio-accent)] px-6 py-2.5 text-sm font-medium text-[--text-on-accent] transition-colors hover:bg-[var(--studio-accent-hover)]"
      >
        Back to home
      </Link>
    </div>
  );
}
