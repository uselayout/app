import { sunsetDate } from "@/lib/sunset";

/** Full-width closure notice for the dashboard. Renders nothing unless a sunset date is set. */
export function SunsetNotice() {
  const closesOn = sunsetDate();
  if (!closesOn) return null;

  return (
    <div className="border-b border-[var(--studio-border)] bg-[var(--bg-surface)] px-6 py-3 text-[13px] text-[var(--text-secondary)]">
      <span className="font-medium text-[var(--text-primary)]">Layout Studio closes on {closesOn}.</span>{" "}
      Save your design systems before then: open each project, click Export, then Download Bundle. Layout Live and the CLI keep working.
      Questions?{" "}
      <a
        href="mailto:hello@layout.design"
        className="text-[var(--text-primary)] underline underline-offset-2 transition-all duration-[var(--duration-base)] ease-[var(--ease-out)] hover:text-[var(--studio-accent-hover)]"
      >
        hello@layout.design
      </a>
    </div>
  );
}

/** Compact pill for the Studio top bar. Renders nothing unless a sunset date is set. */
export function SunsetPill() {
  const closesOn = sunsetDate();
  if (!closesOn) return null;

  return (
    <span
      title={`Layout Studio closes on ${closesOn}. Export your design system before then.`}
      className="inline-flex items-center rounded-full border border-[var(--studio-border-strong)] px-[9px] py-[3px] text-[12px] text-[var(--text-secondary)]"
    >
      Studio closes {closesOn}
    </span>
  );
}
