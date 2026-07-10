import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Camera,
  Webhook,
  Users,
} from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "AI Requests | Layout Docs",
  description:
    "Pin change requests to elements in Layout Live, let your AI agent pick them up over MCP, and watch the pins recolour as the agent reports progress. Includes screenshots, team webhooks, and a shared team queue in the Studio dashboard.",
};

const lifecycle = [
  {
    status: "Pending",
    colour: "Amber pin",
    meaning:
      "You pinned the request and no agent has picked it up yet. It is waiting in the queue.",
  },
  {
    status: "In progress",
    colour: "Blue pin",
    meaning:
      "An agent called mark-request with status in-progress. Work has started on it.",
  },
  {
    status: "Done",
    colour: "Green pin",
    meaning:
      "The agent called mark-request with status done. The entry shows 'Resolved by agent' plus any note the agent left.",
  },
] as const;

export default function LiveRequestsPage() {
  const { prev, next } = getAdjacentPages("/docs/live/requests");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">AI Requests</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Not every tweak is a scrub of padding. When something needs real
          logic, leave the AI a message: pin a free-text request to an element,
          a region, or the whole page in{" "}
          <Link href="/docs/live" className="text-gray-900 hover:underline">
            Layout Live
          </Link>
          , and carry on. Your agent picks the request up over MCP, does the
          work in your actual source, and reports back. The pin on the page
          recolours as the status changes, so you can see at a glance what is
          waiting, what is being worked on, and what is finished.
        </p>
      </div>

      {/* The loop */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <MessageSquare size={20} className="text-gray-500" /> The full loop
        </h2>
        <ol className="space-y-3 text-base text-gray-600 leading-relaxed list-decimal pl-6">
          <li>
            <strong>Pin a request.</strong> Select an element (or drag out a
            region, or target the whole page), open Ask AI from the floating
            selection toolbar, and type what you want changed. The request is
            written to{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              .layout/live/
            </code>{" "}
            with its exact source location and appears in the Requests tab of
            the Layers panel.
          </li>
          <li>
            <strong>The agent picks it up.</strong> In Claude Code (or any
            MCP-capable agent), the{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              get-pending-requests
            </code>{" "}
            tool returns the queue, each request with the file and line it is
            anchored to, so the agent knows exactly what &ldquo;this
            button&rdquo; means.
          </li>
          <li>
            <strong>The agent reports progress.</strong> The{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              mark-request
            </code>{" "}
            tool sets the request to in progress when work starts and done when
            it finishes, with an optional note describing what was changed.
          </li>
          <li>
            <strong>You see the result.</strong> Pins recolour on the page as
            statuses change, and completed entries show{" "}
            <strong>&ldquo;Resolved by agent&rdquo;</strong> alongside the
            agent&apos;s note. Your dev server has already hot-reloaded the
            change, so the fix is on screen.
          </li>
        </ol>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Status</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Pin colour</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lifecycle.map(({ status, colour, meaning }) => (
                <tr key={status} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap pt-3.5">
                    {status}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap pt-3.5">
                    {colour}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout type="tip">
          The compliance meter&apos;s <strong>Ask AI</strong> button files a
          prefilled request describing a specific violation, so routing an
          off-system value to your agent is one click. See the{" "}
          <Link href="/docs/live" className="text-gray-900 font-medium hover:underline">
            compliance quick-fix
          </Link>{" "}
          section on the Live overview.
        </Callout>
      </section>

      {/* Screenshots */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <Camera size={20} className="text-gray-500" /> Screenshots
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Every pinned request automatically captures a screenshot of the page
          at the moment you filed it. Region requests are cropped to the pinned
          region, so the image shows exactly the area you were talking about.
          Agents fetch the stored image with the{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            get-live-screenshot
          </code>{" "}
          MCP tool by passing the request id, or omit the id for a fresh
          capture of whatever Live is showing right now.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          This closes the biggest gap in text-only requests: the agent sees
          what you saw. &ldquo;This looks cramped&rdquo; stops being ambiguous
          when the request arrives with a picture of the cramped thing.
        </p>
      </section>

      {/* Team webhooks */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <Webhook size={20} className="text-gray-500" /> Team webhooks
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Requests can post to a team channel as they are filed. In Live&apos;s{" "}
          <strong>Settings</strong>, add a webhook endpoint and choose the
          format:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>Slack</strong>: an incoming-webhook URL; requests arrive as
            formatted Slack messages.
          </li>
          <li>
            <strong>Discord</strong>: a channel webhook URL; same idea,
            Discord-formatted.
          </li>
          <li>
            <strong>Generic</strong>: any HTTPS endpoint; Live sends a JSON
            payload with the request text, target, status, and project, for
            your own tooling.
          </li>
        </ul>
        <p className="text-base text-gray-600 leading-relaxed">
          This is useful even without the shared cloud queue: a designer
          pinning requests on a review build can feed a{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            #design-fixes
          </code>{" "}
          channel that the whole team sees.
        </p>
      </section>

      {/* Team sync */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <Users size={20} className="text-gray-500" /> Team sync: the shared queue
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Requests can also sync to your organisation&apos;s shared cloud
          queue, so the whole team works from one list rather than per-machine
          logs. Setup takes two steps:
        </p>
        <ol className="space-y-3 text-base text-gray-600 leading-relaxed list-decimal pl-6">
          <li>
            <strong>Create an organisation API key</strong> in the Studio
            dashboard under{" "}
            <Link href="/docs/api-keys" className="text-gray-900 hover:underline">
              Settings → API Keys
            </Link>
            .
          </li>
          <li>
            <strong>Paste the key into Live&apos;s Settings</strong> and enable
            team sync. From then on, requests you pin are pushed to the org
            queue, and teammates&apos; requests flow back to you.
          </li>
        </ol>
        <p className="text-base text-gray-600 leading-relaxed">
          Once syncing, two new surfaces appear:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>The Team section in Live.</strong> Teammates&apos; requests
            for the current project show up in the Requests tab with an{" "}
            <strong>Adopt</strong> button. Adopting a request brings it into
            your local queue so your agent can pick it up and resolve it, even
            though someone else filed it.
          </li>
          <li>
            <strong>The Live Requests page in the Studio dashboard.</strong>{" "}
            The whole team&apos;s queue in one place, grouped by project, with
            status filters (pending, in progress, done). Useful for leads
            triaging what is outstanding without opening Live at all. See{" "}
            <Link href="/docs/dashboard" className="text-gray-900 hover:underline">
              Dashboard &amp; Settings
            </Link>
            .
          </li>
        </ul>
        <Callout type="info">
          Requests work fully offline without team sync: they live in{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            .layout/live/
          </code>{" "}
          and agents read them from disk even when Live is closed. Webhooks and
          team sync are additive layers on top.
        </Callout>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/live/design-tab" className="text-gray-900 hover:underline">
              The Design Tab
            </Link>{" "}
           , edit tokens, browse components, and read guidelines inside Live.
          </li>
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI &amp; MCP Server
            </Link>{" "}
           , the full reference for get-pending-requests, mark-request, and
            get-live-screenshot.
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
