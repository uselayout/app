import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Data & Privacy | Layout Docs",
  description:
    "How Layout handles your design system data: what we extract, where it's stored, and how AI generation works.",
};

export default function DataHandlingPage() {
  const { prev, next } = getAdjacentPages("/docs/data-handling");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Data & Privacy</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          A plain-English explanation of how Layout handles your design system
          data. What we extract, where it lives, what third parties are
          involved, and what we will never do.
        </p>
      </div>

      {/* What we extract */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          What we extract
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          When you point Layout at a Figma file or website, we extract
          structural design data only:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base text-gray-600">
          <li>
            <strong>Design tokens:</strong> colours, typography scales,
            spacing values, border radii, and effects.
          </li>
          <li>
            <strong>Component metadata:</strong> component names, variant
            counts, and properties. Not the full design file.
          </li>
          <li>
            <strong>Screenshots:</strong> small screenshots of individual
            components for visual reference.
          </li>
          <li>
            <strong>The generated layout.md:</strong> a structured text file
            synthesised from the above.
          </li>
          <li>
            <strong>Explorer variants:</strong> when you generate component
            variants in the Explorer, the generated TSX code, your prompt,
            and any reference images or context files you attached are stored
            as part of your project.
          </li>
        </ul>
        <Callout type="info">
          We do not extract full page designs, product content, user data from
          your screens, or anything beyond the structural design system.
        </Callout>
      </section>

      {/* Where data is stored */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Where data is stored
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          All project data is stored in a self-hosted PostgreSQL database
          (via Supabase) running on infrastructure we control at Hetzner in
          Germany. This is not a shared multi-tenant cloud service.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base text-gray-600">
          <li>
            Your data is scoped to your account and organisation. No other
            user can access it.
          </li>
          <li>
            Component screenshots are stored in private Supabase Storage
            buckets on the same infrastructure.
          </li>
          <li>
            You can export your full design system bundle (layout.md, tokens,
            components) at any time via the Export button in Studio.
          </li>
          <li>
            If you delete a project, its extraction data, layout.md, and
            screenshots are removed.
          </li>
        </ul>
      </section>

      {/* How AI generation works */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          How AI generation works
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout uses AI to synthesise your layout.md and generate component
          variants in the Explorer. Your extracted design tokens and component
          metadata are sent to the AI provider as part of these requests.
          There are two modes:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  Mode
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  How it works
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  Credits
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  <strong>Managed</strong>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Layout uses our own Anthropic API key. Your data passes
                  through our server to Claude.
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Deducted from your plan allowance.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  <strong>BYOK</strong>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  You provide your own API key. Your data still flows through
                  our server, but the AI call uses your key.
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  No credits deducted. Billed directly by the provider.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-base text-gray-600 leading-relaxed">
          In both modes, we log token counts for billing and analytics. We
          never store the full AI request or response content.
        </p>
        <Callout type="info">
          Anthropic&apos;s API terms explicitly prohibit them from training on
          API inputs. The same applies to Google AI&apos;s API terms. Your
          design system data is not used to train any AI model.
        </Callout>
      </section>

      {/* API key handling */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          API key handling
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Your personal API keys (Anthropic, Google AI, Figma) are stored in
          your browser&apos;s{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            localStorage
          </code>
          . When you make a request that needs an AI provider, your key is
          sent to our server as a request header, used to call the provider,
          and then discarded. Keys are never written to our database or
          logged.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          For more detail, see the{" "}
          <Link
            href="/docs/api-keys"
            className="text-indigo-600 hover:underline"
          >
            API Keys
          </Link>{" "}
          docs page.
        </p>
      </section>

      {/* Sub-processors */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Sub-processors
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The following third-party services process some of your data as
          part of Layout&apos;s functionality:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  Service
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  Purpose
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  What data is shared
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  <strong>Anthropic</strong>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  layout.md generation and Explorer variant generation
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Design tokens, component metadata, screenshots (as context
                  for AI generation). Not stored by Anthropic. Not used for
                  training.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  <strong>Google AI</strong>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  AI image generation and Gemini model access
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Image generation prompts and style context. Not used for
                  training via API.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  <strong>Stripe</strong>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Payment processing
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Billing information only. No design data.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  <strong>Hetzner</strong>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Infrastructure hosting (Germany)
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  All project data resides on Hetzner servers. Encrypted at
                  rest and in transit.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* What we never do */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          What we never do
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-base text-gray-600">
          <li>
            <strong>Train AI models on your data.</strong> Your design system
            data is never used to train, fine-tune, or improve any AI model.
          </li>
          <li>
            <strong>Share or sell your data.</strong> Your extraction data,
            layout.md, and components are never shared with third parties
            beyond the sub-processors listed above.
          </li>
          <li>
            <strong>Access your data for our own product development.</strong>{" "}
            We do not look at, aggregate, or analyse individual
            customers&apos; design systems.
          </li>
          <li>
            <strong>Store your API keys.</strong> Personal API keys exist
            only in your browser. They are never written to our database.
          </li>
          <li>
            <strong>Crawl your Figma workspace.</strong> We read only the
            specific file you point us at. We do not access other files in
            your account.
          </li>
        </ul>
      </section>

      {/* Organisations */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Organisations and teams
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          If you use Layout within an organisation, all projects and
          components are shared with members of that organisation based on
          their role (owner, admin, editor, viewer). Your personal API keys
          and login credentials are never shared with other org members.
        </p>
      </section>

      {/* Data retention */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Data retention and deletion
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-base text-gray-600">
          <li>
            Project data is retained for as long as your account is active.
          </li>
          <li>
            Deleting a project removes its extraction data, layout.md,
            variants, and screenshots.
          </li>
          <li>
            Deleting your account removes all personal data and project data
            within 30 days.
          </li>
          <li>
            Anonymous, aggregated analytics (page views via self-hosted
            Plausible) cannot identify you and may be retained indefinitely.
          </li>
        </ul>
      </section>

      {/* Legal pages */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Legal pages
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          For the full legal text, see our{" "}
          <Link
            href="/privacy"
            className="text-indigo-600 hover:underline"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms"
            className="text-indigo-600 hover:underline"
          >
            Terms of Service
          </Link>
          . If you have questions about how we handle your data, contact us
          at{" "}
          <a
            href="mailto:hello@layout.design"
            className="text-indigo-600 hover:underline"
          >
            hello@layout.design
          </a>
          .
        </p>
      </section>

      {/* Prev/Next navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        {prev ? (
          <Link
            href={prev.href}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0a0a0a] transition-colors"
          >
            <ArrowLeft size={14} />
            {prev.title}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.href}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0a0a0a] transition-colors"
          >
            {next.title}
            <ArrowRight size={14} />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
