import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Layout",
  description:
    "Terms of Service for Layout — the compiler between design systems and AI coding agents.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080705] text-white">
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Effective date: 1 March 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-neutral-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Layout (<span className="text-neutral-200">layout.design</span>),
              you agree to be bound by these Terms of Service. If you do not agree
              to these terms, please do not use the service. We may update these
              terms from time to time — continued use after changes constitutes
              acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              2. Description of Service
            </h2>
            <p>
              Layout is a tool that extracts design systems from Figma files and
              live websites, then transforms them into structured, LLM-optimised
              context bundles for AI coding agents. The service includes a
              web-based studio, API endpoints, and a command-line interface.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              3. Account Responsibilities
            </h2>
            <p>
              You are responsible for maintaining the security of your account
              credentials and for all activity that occurs under your account.
              You must provide accurate information when creating an account and
              keep it up to date. You must notify us immediately if you become
              aware of any unauthorised use of your account.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              4. API Keys and Third-Party Credentials
            </h2>
            <p>
              Layout may require you to provide API keys for third-party services
              (such as Anthropic or Figma). These keys are stored in your
              browser&apos;s localStorage and are sent to our server only when
              needed to process your requests. We do not persist your API keys
              server-side. You are solely responsible for the security and proper
              use of any API keys you provide.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Use the service for any unlawful purpose or in violation of any
                applicable laws or regulations.
              </li>
              <li>
                Attempt to gain unauthorised access to the service, other
                accounts, or any related systems or networks.
              </li>
              <li>
                Interfere with or disrupt the service or the servers and
                networks connected to it.
              </li>
              <li>
                Use the service to extract design systems from Figma files or
                websites without proper authorisation from their owners.
              </li>
              <li>
                Resell, redistribute, or sublicense access to the service
                without our prior written consent.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              6. Intellectual Property
            </h2>
            <p>
              <strong className="text-white">Your data is yours.</strong> You
              retain full ownership of all design system data, layout.md files,
              context bundles, and any other content you create or extract using
              Layout. We claim no intellectual property rights over your content.
            </p>
            <p className="mt-3">
              The Layout service itself — including its interface, branding,
              documentation, and underlying code — is owned by Layout and
              protected by copyright and other intellectual property laws. You
              may not copy, modify, or reverse-engineer any part of the service
              except where expressly permitted.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              7. Service Availability
            </h2>
            <p>
              We strive to keep Layout available and reliable, but we do not
              guarantee uninterrupted or error-free access. The service is
              provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis. We may perform maintenance, updates, or
              modifications that temporarily affect availability. We do not
              offer a formal service-level agreement (SLA).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              8. Payment and Billing
            </h2>
            <p>
              Certain features of Layout may require a paid subscription. All
              billing is handled through Stripe. Your payment card details are
              processed entirely by Stripe and never touch our servers. By
              subscribing to a paid plan, you agree to pay the applicable fees.
              We reserve the right to change pricing with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              9. Termination
            </h2>
            <p>
              You may close your account at any time by contacting us. We may
              suspend or terminate your account if you breach these terms or
              engage in conduct that we reasonably believe is harmful to the
              service or other users. Upon termination, your right to use the
              service ceases immediately. We will make reasonable efforts to
              allow you to export your data before deletion.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              10. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Layout and its operators
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of profits, data,
              or goodwill, arising out of or in connection with your use of the
              service. Our total liability for any claim relating to the service
              shall not exceed the amount you paid us in the twelve months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              11. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless Layout and its operators
              from any claims, damages, or expenses arising from your use of the
              service, your violation of these terms, or your infringement of
              any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              12. Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with the
              laws of England and Wales. Any disputes arising from these terms or
              the use of the service shall be subject to the exclusive
              jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              13. Contact
            </h2>
            <p>
              If you have questions about these terms, please contact us at{" "}
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
