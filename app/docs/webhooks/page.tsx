import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Webhooks - Layout Docs",
  description:
    "Automatic design system sync when Figma files change. Set up webhooks to re-extract tokens and open GitHub pull requests on every publish.",
};

export default function WebhooksPage() {
  const { prev, next } = getAdjacentPages("/docs/webhooks");

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Webhooks</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Automatic design system sync when Figma files change. Connect Layout
          to Figma&apos;s webhook system so that every time a designer publishes
          updates, your tokens are re-extracted and - optionally - a GitHub pull
          request is opened with the diff.
        </p>
      </div>

      {/* How It Works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">How It Works</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The flow from designer publish to pull request is fully automatic once
          configured:
        </p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              step: "1",
              label: "Designer publishes changes in Figma",
              desc: "Any file update or team library publish triggers a webhook event from Figma.",
            },
            {
              step: "2",
              label: "Figma sends a webhook event to Layout",
              desc: "The event is posted to your Layout webhook endpoint with a shared passcode for verification.",
            },
            {
              step: "3",
              label: "Layout re-extracts the design system",
              desc: "Layout fetches the updated Figma file and extracts the latest tokens, styles, and components.",
            },
            {
              step: "4",
              label: "GitHub pull request opened (optional)",
              desc: "If GitHub is configured, Layout creates a branch and opens a PR with a visual diff of changed tokens.",
            },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex gap-4 px-5 py-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-900 mt-0.5">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a0a0a]">{label}</p>
                <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Setup */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>

        {/* Step 1 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Step 1 - Configure in Layout
          </h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-600 text-base">
            <li>
              Go to{" "}
              <strong className="font-semibold text-[#0a0a0a]">
                Settings &gt; Webhooks
              </strong>{" "}
              in your organisation dashboard.
            </li>
            <li>
              Copy the webhook endpoint URL - for example:{" "}
              <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
                https://studio.yourdomain.com/api/webhooks/figma
              </code>
            </li>
            <li>Generate a passcode or enter a custom one.</li>
          </ol>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Step 2 - Configure in Figma
          </h3>
          <Callout type="info">
            Creating webhooks in Figma requires admin access to the team or
            organisation.
          </Callout>
          <ol className="list-decimal pl-6 space-y-2 text-gray-600 text-base">
            <li>
              Go to{" "}
              <strong className="font-semibold text-[#0a0a0a]">
                Figma Admin &gt; Webhooks
              </strong>
              .
            </li>
            <li>Create a new webhook.</li>
            <li>Paste your Layout webhook URL as the endpoint.</li>
            <li>
              Enter the same passcode you configured in Layout.
            </li>
            <li>
              Select the event types to listen for -{" "}
              <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
                FILE_UPDATE
              </code>{" "}
              is the most useful for keeping tokens in sync.
            </li>
          </ol>
        </div>

        {/* Step 3 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Step 3 - GitHub Integration (Optional)
          </h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-600 text-base">
            <li>
              In{" "}
              <strong className="font-semibold text-[#0a0a0a]">
                Layout Settings &gt; Webhooks
              </strong>
              , expand the GitHub section.
            </li>
            <li>
              Enter the following: repository owner, repository name, target
              branch, and a GitHub personal access token with{" "}
              <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
                repo
              </code>{" "}
              scope.
            </li>
            <li>
              When a webhook triggers re-extraction, Layout creates a branch and
              opens a pull request with the diff of changed tokens.
            </li>
          </ol>
        </div>
      </section>

      {/* Webhook Events */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Webhook Events</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout listens for the following Figma event types:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Event
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  What Happens
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap pt-3.5">
                  FILE_UPDATE
                </td>
                <td className="px-4 py-3 text-gray-600">
                  Re-extracts tokens from the updated Figma file. Triggered
                  whenever a file is saved or published.
                </td>
              </tr>
              <tr className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap pt-3.5">
                  LIBRARY_PUBLISH
                </td>
                <td className="px-4 py-3 text-gray-600">
                  Re-extracts when a team library is published. Useful for
                  shared design systems used across multiple files.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Security</h2>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              label: "Passcode verification",
              desc: "All incoming webhook requests are verified against the shared passcode. Requests with an invalid or missing passcode are rejected with a 401 response.",
            },
            {
              label: "Passcode storage",
              desc: "The passcode is never stored in plaintext. It is hashed before being saved to the database.",
            },
            {
              label: "HTTPS only",
              desc: "Figma only delivers webhooks to HTTPS endpoints. Your Layout instance must be served over TLS for webhooks to work.",
            },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-4 px-5 py-4">
              <div className="min-w-[200px] text-sm font-semibold text-[#0a0a0a]">
                {label}
              </div>
              <div className="text-sm text-gray-600">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600 text-base">
          <li>
            Test your webhook setup by making a small change in Figma and
            publishing - you should see a new extraction appear in your Layout
            project within a few seconds.
          </li>
          <li>
            Check the audit log in{" "}
            <strong className="font-semibold text-[#0a0a0a]">
              Settings &gt; Webhooks
            </strong>{" "}
            to verify events are being received and processed correctly.
          </li>
          <li>
            GitHub pull requests include a visual diff of changed tokens, making
            it easy to review what a designer changed before merging.
          </li>
          <li>
            If you only want to sync one Figma file, scope your webhook to that
            file&apos;s ID in the Figma webhook configuration. This avoids
            triggering unnecessary extractions from unrelated files.
          </li>
        </ul>
      </section>

      {/* Prev / Next */}
      <nav className="flex items-center justify-between border-t border-gray-200 pt-8">
        <div>
          {prev && (
            <Link
              href={prev.href}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              {prev.title}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link
              href={next.href}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {next.title}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
