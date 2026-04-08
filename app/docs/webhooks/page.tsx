import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Webhooks | Layout Docs",
  description:
    "Receive notifications when Figma files or GitHub repos change. Set up webhooks to automatically re-extract your design system.",
};

export default function WebhooksPage() {
  const { prev, next } = getAdjacentPages("/docs/webhooks");

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Webhooks</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Get notified when Figma files or GitHub repos change. Connect Layout
          to Figma&apos;s webhook system or your GitHub repository so that every
          time a designer publishes updates or tokens are committed to code,
          Layout automatically re-extracts your design system.
        </p>
      </div>

      {/* How It Works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">How It Works</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The flow from designer publish to webhook notification:
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
              label: "Layout automatically re-extracts the design system",
              desc: "The webhook is verified and a background re-extraction is triggered for the matching project. A 60-second debounce prevents duplicate runs. A diff of what changed is available in the Studio.",
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

      {/* Auto Re-extraction Notice */}
      <Callout type="info">
        <strong>Automatic re-extraction is now active.</strong> When Layout receives a{" "}
        <code className="text-xs bg-gray-100 rounded px-1 py-0.5">FILE_UPDATE</code> or{" "}
        <code className="text-xs bg-gray-100 rounded px-1 py-0.5">LIBRARY_PUBLISH</code> event,
        it automatically triggers a background re-extraction for the matching project. A 60-second
        debounce per project prevents duplicate runs from rapid successive publishes. GitHub push
        webhooks are also supported for triggering re-extraction on code-driven design token changes.
      </Callout>

      {/* Setup */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>

        {/* Step 1 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Step 1: Configure in Layout
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
              Copy the webhook endpoint URL, for example:{" "}
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
            Step 2: Configure in Figma
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
              Select the event types to listen for.{" "}
              <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
                FILE_UPDATE
              </code>{" "}
              is the most useful for keeping tokens in sync.
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
                  Triggers automatic background re-extraction for the matching
                  project. A 60-second debounce prevents duplicate runs from
                  rapid successive saves.
                </td>
              </tr>
              <tr className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap pt-3.5">
                  LIBRARY_PUBLISH
                </td>
                <td className="px-4 py-3 text-gray-600">
                  Triggers automatic background re-extraction when a team
                  library is published. Useful for shared design systems used
                  across multiple files.
                </td>
              </tr>
              <tr className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap pt-3.5">
                  GitHub push
                </td>
                <td className="px-4 py-3 text-gray-600">
                  Triggers re-extraction when a push to a configured branch is
                  received. Useful when design tokens are managed as code and
                  committed to a repository.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* GitHub Webhooks */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">GitHub Webhooks</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          If your design tokens are managed as code (e.g. CSS custom properties
          or JSON tokens committed to a repository), you can connect a GitHub
          webhook to trigger automatic re-extraction when tokens change.
        </p>

        {/* GitHub Step 1 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Step 1: Configure in Layout
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
              In the <strong className="font-semibold text-[#0a0a0a]">GitHub</strong>{" "}
              section, enter your GitHub Personal Access Token (PAT).
            </li>
            <li>
              Set the repository owner, name, and branch to watch (e.g.{" "}
              <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
                main
              </code>
              ).
            </li>
            <li>
              Copy the GitHub webhook endpoint URL:{" "}
              <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
                https://studio.yourdomain.com/api/webhooks/github
              </code>
            </li>
          </ol>
        </div>

        {/* GitHub Step 2 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Step 2: Configure in GitHub
          </h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-600 text-base">
            <li>
              Go to your repository&apos;s{" "}
              <strong className="font-semibold text-[#0a0a0a]">
                Settings &gt; Webhooks
              </strong>
              .
            </li>
            <li>Click <strong className="font-semibold text-[#0a0a0a]">Add webhook</strong>.</li>
            <li>Paste your Layout GitHub webhook URL as the Payload URL.</li>
            <li>
              Set content type to{" "}
              <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
                application/json
              </code>
              .
            </li>
            <li>
              Enter a webhook secret. This is used for HMAC-SHA256 verification
              of incoming requests.
            </li>
            <li>
              Under events, select{" "}
              <strong className="font-semibold text-[#0a0a0a]">Just the push event</strong>.
            </li>
          </ol>
        </div>

        <Callout type="info">
          GitHub webhook payloads are verified using HMAC-SHA256 signatures. The{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            X-Hub-Signature-256
          </code>{" "}
          header is checked against your webhook secret on every request.
          Requests with invalid or missing signatures are rejected. A 60-second
          debounce per project prevents duplicate re-extractions from rapid
          successive pushes.
        </Callout>
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
              label: "GitHub HMAC verification",
              desc: "GitHub webhook payloads are verified using HMAC-SHA256 signatures via the X-Hub-Signature-256 header. Invalid signatures are rejected with a 401 response.",
            },
            {
              label: "HTTPS only",
              desc: "Figma only delivers webhooks to HTTPS endpoints. GitHub strongly recommends HTTPS. Your Layout instance must be served over TLS for webhooks to work.",
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
            publishing. The event should appear in your webhook logs. Then
            click Re-extract in the Studio to confirm the latest changes
            are picked up.
          </li>
          <li>
            If you only want to track one Figma file, scope your webhook to
            that file&apos;s ID in the Figma webhook configuration. This
            avoids unnecessary notifications from unrelated files.
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
