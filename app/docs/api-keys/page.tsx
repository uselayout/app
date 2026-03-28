import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "API Keys | Layout Docs",
  description:
    "How API keys are stored in Layout, why they can disappear, and how to re-add them.",
};

export default function ApiKeysPage() {
  const { prev, next } = getAdjacentPages("/docs/api-keys");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">API Keys</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout uses your own API keys to connect to AI providers and Figma.
          Keys are stored locally in your browser and never sent to our servers.
          This page explains how storage works, why keys can disappear, and how
          to fix it.
        </p>
      </div>

      {/* How keys are stored */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          How keys are stored
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          When you add an API key in{" "}
          <strong>Settings &rarr; API Keys</strong>, it is saved to your
          browser&apos;s{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            localStorage
          </code>
          . This is a deliberate security choice:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base text-gray-600">
          <li>
            Keys never leave your browser. They are sent directly to the AI
            provider (Anthropic, Google AI) via your browser, not via our
            servers.
          </li>
          <li>
            We cannot read, log, or access your keys. If you lose a key, we
            cannot recover it for you.
          </li>
          <li>
            There is no server-side database of personal API keys. Your keys
            exist only in the browser that saved them.
          </li>
        </ul>

        <Callout type="info">
          This is the same approach used by tools like the Anthropic Console
          Workbench and Google AI Studio. Your keys stay with you.
        </Callout>
      </section>

      {/* Why keys can disappear */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Why keys can disappear
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Because keys are stored in{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            localStorage
          </code>
          , they are scoped to your specific browser profile and origin. Several
          common actions will cause them to disappear:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  Action
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  What happens
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Switch Chrome profile or window
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Each Chrome profile has its own localStorage. Keys from one
                  profile are not available in another.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Clear browsing data / cookies
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Most &quot;clear data&quot; options also clear localStorage,
                  which removes your keys.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Use incognito / private mode
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Incognito localStorage is wiped when you close the window.
                  Keys do not persist.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Switch to a different browser
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Chrome, Firefox, Safari, and Arc each have separate storage.
                  Keys from one browser are not available in another.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Log in on a different device
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  Keys are stored per-device, not per-account. Logging into
                  Layout on a new laptop requires re-adding your keys.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout type="tip">
          Layout will show an amber warning banner in the Explorer Canvas if it
          detects that keys you previously added are no longer available. Look
          for the key icon next to the model selector.
        </Callout>
      </section>

      {/* How to re-add keys */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          How to re-add keys
        </h2>
        <ol className="list-decimal pl-6 space-y-3 text-base text-gray-600">
          <li>
            Go to{" "}
            <strong>Settings &rarr; API Keys</strong> (or click the amber
            &quot;Add keys&quot; link in the Explorer toolbar).
          </li>
          <li>Paste your API key and click <strong>Save</strong>.</li>
          <li>
            Keys take effect immediately. No page reload or restart is needed.
          </li>
        </ol>
        <p className="text-base text-gray-600 leading-relaxed">
          If you no longer have your API key, you can generate a new one from
          the provider&apos;s console:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base text-gray-600">
          <li>
            <strong>Anthropic:</strong>{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              console.anthropic.com/settings/keys
            </a>
          </li>
          <li>
            <strong>Google AI:</strong>{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              aistudio.google.com/apikey
            </a>
          </li>
          <li>
            <strong>Figma:</strong>{" "}
            <a
              href="https://www.figma.com/developers/api#access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              figma.com/developers/api
            </a>{" "}
            (Personal Access Token)
          </li>
        </ul>
      </section>

      {/* Which keys you need */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Which keys you need
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Not every feature requires a key. Here is what each key unlocks:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  Feature
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  Key required
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Explorer (Claude Sonnet 4.6)
                </td>
                <td className="px-4 py-2.5 text-gray-600">None (uses hosted credits)</td>
                <td className="px-4 py-2.5 text-gray-600">
                  Add your own Anthropic key for unlimited usage
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Explorer (Claude Opus 4.5)
                </td>
                <td className="px-4 py-2.5 text-gray-600">Anthropic API key</td>
                <td className="px-4 py-2.5 text-gray-600">
                  BYOK only. Billed directly by Anthropic.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Explorer (Gemini 3.1 Pro)
                </td>
                <td className="px-4 py-2.5 text-gray-600">Google AI API key</td>
                <td className="px-4 py-2.5 text-gray-600">
                  BYOK only. Billed directly by Google.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Figma extraction
                </td>
                <td className="px-4 py-2.5 text-gray-600">Figma Personal Access Token</td>
                <td className="px-4 py-2.5 text-gray-600">
                  Required to read your Figma files via the REST API.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  Website extraction
                </td>
                <td className="px-4 py-2.5 text-gray-600">None</td>
                <td className="px-4 py-2.5 text-gray-600">
                  Uses a headless browser. No API key needed.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">
                  AI image generation
                </td>
                <td className="px-4 py-2.5 text-gray-600">Google AI API key</td>
                <td className="px-4 py-2.5 text-gray-600">
                  Used to generate placeholder images in components.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <ul className="list-disc pl-6 space-y-3 text-base text-gray-600">
          <li>
            <strong>Use the same Chrome profile consistently.</strong> If you
            always open Layout in the same profile, your keys will persist
            between sessions.
          </li>
          <li>
            <strong>Bookmark the API Keys settings page.</strong> If you need to
            re-add keys frequently (e.g. you use multiple machines), bookmark
            the settings page for quick access.
          </li>
          <li>
            <strong>Keys are per-browser, not per-account.</strong> If you log
            in from a different device or browser, you will need to re-add your
            keys. Your Layout account does not sync keys across devices.
          </li>
          <li>
            <strong>BYOK means unlimited free usage.</strong> When you provide
            your own API key, Layout does not charge credits. You are billed
            directly by the provider at their standard rates.
          </li>
        </ul>
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
