import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Layout",
  description:
    "Privacy Policy for Layout — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="dark min-h-screen bg-[var(--mkt-bg)] text-white">
      <header className="mx-auto max-w-3xl px-6 pt-12 pb-8">
        <Link href="/" className="inline-block">
          <Image
            src="/marketing/logo-white.svg"
            alt="Layout"
            width={100}
            height={28}
            priority
          />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Effective date: 1 March 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-neutral-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              1. Introduction
            </h2>
            <p>
              Layout (<span className="text-neutral-200">layout.design</span>)
              is operated from the United Kingdom. We are committed to
              protecting your privacy and being transparent about how we handle
              your data. This policy explains what information we collect, how we
              use it, and what rights you have.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              2. What Data We Collect
            </h2>

            <h3 className="mt-4 mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Account Information
            </h3>
            <p>
              When you create an account, we collect your name, email address,
              and authentication credentials. If you sign in via Google or
              GitHub, we receive your profile information from those providers
              (name, email, and avatar).
            </p>

            <h3 className="mt-4 mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Project Data
            </h3>
            <p>
              Design system extractions, layout.md files, context bundles, and
              related project data you create within Layout. This data is stored
              in our self-hosted database and is scoped to your account — no
              other user can access it.
            </p>

            <h3 className="mt-4 mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Usage Analytics
            </h3>
            <p>
              We use self-hosted Plausible Analytics to collect anonymous usage
              data such as page views, referral sources, and device type. Plausible
              does not use cookies, does not collect personal information, and all
              data is stored on our own infrastructure. No data is shared with
              third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              3. API Key Handling
            </h2>
            <p>
              Layout may ask you to provide API keys for third-party services
              (e.g. Anthropic, Figma). These keys are stored exclusively in your
              browser&apos;s localStorage. They are sent to our server only when
              required to process a specific request on your behalf and are never
              written to our database or logged. Clearing your browser data
              removes them entirely.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              4. How We Store Your Data
            </h2>
            <p>
              Account and project data is stored in a self-hosted PostgreSQL
              database (via Supabase) on infrastructure we control. We do not
              use shared multi-tenant cloud databases. Authentication sessions
              are managed by Better Auth and stored in the same PostgreSQL
              instance. All connections use encrypted transport.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              5. Cookies
            </h2>
            <p>
              Layout uses a single session cookie to keep you signed in. This
              cookie is{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-200">
                httpOnly
              </code>{" "}
              and{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-200">
                secure
              </code>
              , meaning it cannot be accessed by JavaScript and is only sent over
              HTTPS. We do not use advertising cookies, tracking cookies, or any
              other non-essential cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              6. Website Extraction
            </h2>
            <p>
              When you use Layout to extract a design system from a live website,
              we use Playwright server-side to visit the URL you provide. We
              capture CSS properties and screenshots for the purpose of building
              your design system context. This data is associated with your
              project and is not shared with anyone else.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              7. Third-Party Services
            </h2>
            <p>We integrate with the following third-party services:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Stripe</strong> — processes
                subscription payments. Your payment card details are handled
                entirely by Stripe and never touch our servers. See{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
                >
                  Stripe&apos;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-white">Google OAuth</strong> — if you
                choose to sign in with Google, we receive your name, email, and
                profile picture. We do not request access to any other Google
                data.
              </li>
              <li>
                <strong className="text-white">GitHub OAuth</strong> — if you
                choose to sign in with GitHub, we receive your name, email, and
                avatar. We do not request access to your repositories or other
                GitHub data.
              </li>
              <li>
                <strong className="text-white">Plausible Analytics</strong>{" "}
                — self-hosted, cookie-free, privacy-focused web analytics. No
                personal data is collected or shared.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              8. Data Retention
            </h2>
            <p>
              We retain your account data and project data for as long as your
              account is active. If you delete your account, we will remove your
              personal data and project data within 30 days. Anonymous,
              aggregated analytics data (which cannot identify you) may be
              retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              9. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-white">Access</strong> — request a copy
                of all personal data we hold about you.
              </li>
              <li>
                <strong className="text-white">Correction</strong> — ask us to
                correct any inaccurate information.
              </li>
              <li>
                <strong className="text-white">Deletion</strong> — ask us to
                delete your account and all associated data.
              </li>
              <li>
                <strong className="text-white">Export</strong> — download your
                project data (design system bundles) at any time through the
                export feature in the studio.
              </li>
              <li>
                <strong className="text-white">Restriction</strong> — ask us
                to restrict processing of your data in certain circumstances.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a
                href="mailto:hello@layout.design"
                className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
              >
                hello@layout.design
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              10. Children&apos;s Privacy
            </h2>
            <p>
              Layout is not intended for use by anyone under the age of 16. We
              do not knowingly collect personal information from children. If we
              learn that we have collected data from a child under 16, we will
              delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify you of significant changes by posting a notice on the
              service or by email. Continued use of Layout after changes take
              effect constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              12. Contact
            </h2>
            <p>
              If you have questions about this privacy policy or how we handle
              your data, please contact us at{" "}
              <a
                href="mailto:hello@layout.design"
                className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
              >
                hello@layout.design
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
