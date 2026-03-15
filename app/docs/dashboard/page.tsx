import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Dashboard & Settings - Layout Docs",
  description:
    "Overview of the organisation dashboard pages and settings - API keys, audit log, webhooks, templates, and members.",
};

export default function DashboardPage() {
  const { prev, next } = getAdjacentPages("/docs/dashboard");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Dashboard &amp; Settings</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The organisation dashboard provides specialised views for managing
          your design system. Settings gives you control over API access,
          integrations, and team membership.
        </p>
      </div>

      {/* Dashboard */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Dashboard</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The dashboard is split into dedicated pages, each focused on a
          specific aspect of your design system workflow.
        </p>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Page</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "Projects",
                  "View and manage all design system projects. Create new extractions, open the Studio.",
                ],
                [
                  "Candidates",
                  "Review design variants submitted by team members from the Explorer Canvas.",
                ],
                [
                  "Drift",
                  "Monitor design system compliance. Detect when components deviate from tokens.",
                ],
                [
                  "Analytics",
                  "View usage metrics - token usage frequency, component adoption rates.",
                ],
                ["Icons", "Browse and manage your icon library."],
                [
                  "Typography",
                  "Explore typography tokens with live previews.",
                ],
                [
                  "Tokens",
                  "Browse, search, and edit all design tokens in one place.",
                ],
                [
                  "Library",
                  "Create and manage reusable components (see Component Library docs).",
                ],
              ].map(([page, purpose]) => (
                <tr key={page} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">
                    {page}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Settings */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Settings</h2>

        {/* API Keys */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">API Keys</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Create and manage API keys for programmatic access.</li>
            <li>
              Keys are used by the CLI (
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                @layoutdesign/context
              </code>
              ) for authenticated operations.
            </li>
            <li>Each key is scoped to the organisation.</li>
            <li>Revoke keys at any time from the settings page.</li>
          </ul>
        </div>

        {/* Audit Log */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Audit Log</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              Chronological history of all actions taken within the
              organisation.
            </li>
            <li>
              Tracks: project creation, extraction, export, member changes,
              settings updates.
            </li>
            <li>Filterable by action type and user.</li>
            <li>Useful for compliance and debugging.</li>
          </ul>
        </div>

        {/* Webhooks */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Webhooks</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              Configure Figma webhooks for automatic re-extraction when designs
              change.
            </li>
            <li>
              Optionally connect a GitHub repository for automatic PR creation
              with design diffs.
            </li>
            <li>
              See the{" "}
              <Link
                href="/docs/webhooks"
                className="text-gray-900 hover:underline"
              >
                Webhooks docs page
              </Link>{" "}
              for detailed setup instructions.
            </li>
          </ul>
        </div>

        {/* Templates */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Templates</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Publish design systems as reusable templates.</li>
            <li>
              Manage published templates - update, unpublish, edit metadata.
            </li>
            <li>
              See the{" "}
              <Link
                href="/docs/templates"
                className="text-gray-900 hover:underline"
              >
                Templates docs page
              </Link>{" "}
              for full details.
            </li>
          </ul>
        </div>

        {/* Members */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Members</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Invite new team members by email.</li>
            <li>Assign and change roles (Owner, Admin, Member).</li>
            <li>Remove members from the organisation.</li>
          </ul>
        </div>

        <Callout type="info">
          Only Owners and Admins can access Settings. Members can view the
          dashboard pages but cannot modify organisation-level configuration.
        </Callout>
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
