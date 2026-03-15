import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Organisations - Layout Docs",
  description:
    "Multi-user teams with role-based access control in Layout Studio.",
};

const roles = [
  {
    role: "Owner",
    permissions:
      "Full access - manage billing, delete org, manage all settings",
  },
  {
    role: "Admin",
    permissions: "Manage members, settings, projects, and components",
  },
  {
    role: "Member",
    permissions: "View and edit projects, components, and templates",
  },
];

export default function OrganisationsPage() {
  const { prev, next } = getAdjacentPages("/docs/organisations");

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          Organisations &amp; Teams
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Multi-user teams with role-based access control. Organisations let you
          collaborate with colleagues, scope all data to a shared workspace, and
          manage access permissions per member.
        </p>
      </div>

      {/* Roles */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Roles</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Every member of an organisation has one of three roles. Roles are
          assigned when a member is invited and can be changed later by an Owner
          or Admin.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Role
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Permissions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map(({ role, permissions }) => (
                <tr key={role} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-semibold text-[#0a0a0a] whitespace-nowrap">
                    {role}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{permissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Creating an Organisation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Creating an Organisation
        </h2>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            { step: "1", label: "Sign in to Layout" },
            {
              step: "2",
              label: 'Click your profile menu and select "Create Organisation"',
            },
            { step: "3", label: "Enter an organisation name and slug" },
            {
              step: "4",
              label: "You become the Owner automatically",
            },
          ].map(({ step, label }) => (
            <div key={step} className="flex gap-4 px-5 py-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-900 mt-0.5">
                {step}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Inviting Members */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Inviting Members
        </h2>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              step: "1",
              label: "Go to Settings in your organisation dashboard",
            },
            { step: "2", label: "Navigate to the Members section" },
            { step: "3", label: "Enter an email address and select a role" },
            {
              step: "4",
              label: "Click Invite - the user receives an email invitation",
            },
          ].map(({ step, label }) => (
            <div key={step} className="flex gap-4 px-5 py-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-900 mt-0.5">
                {step}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
        <Callout type="info">
          Invited users must have a Layout account. If they do not have one yet,
          they will be prompted to sign up when they follow the invitation link.
        </Callout>
      </section>

      {/* Scoping */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Scoping</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          All data in Layout is scoped to an organisation. Nothing crosses
          organisational boundaries - a project created in one org is not
          visible in another.
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-2">
          {[
            "Projects and extractions",
            "Component library",
            "Templates (published and installed)",
            "API keys",
            "Audit log",
            "Webhook configurations",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">-</span>
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Switching Organisations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Switching Organisations
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Use the organisation switcher in the sidebar to move between orgs.
          Each org has its own dashboard, projects, and settings. Switching orgs
          does not affect your session - you remain signed in throughout.
        </p>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              heading: "One org per team",
              body: "Start with a single org for your team. Create separate orgs for different clients or products if you need stronger data isolation.",
            },
            {
              heading: "API keys are org-scoped",
              body: "A key created in one org cannot access another org's data. Generate separate keys for each org you need programmatic access to.",
            },
            {
              heading: "Audit log",
              body: "The audit log tracks all actions per organisation. Use it for compliance reviews or to investigate unexpected changes.",
            },
          ].map(({ heading, body }) => (
            <div key={heading} className="flex gap-4 px-5 py-4">
              <div className="min-w-[180px] text-sm font-semibold text-[#0a0a0a]">
                {heading}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
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
