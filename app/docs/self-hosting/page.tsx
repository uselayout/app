import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Self-Hosting — SuperDuper Docs",
  description:
    "Deploy SuperDuper AI Studio on your own infrastructure using Docker, Coolify, Railway, or any VPS.",
};

export default function SelfHostingPage() {
  const { prev, next } = getAdjacentPages("/docs/self-hosting");

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Self-Hosting</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          SuperDuper AI Studio is fully open source and designed to run on your
          own infrastructure. This guide covers everything you need to deploy it
          — from environment variables to Docker builds to platform-specific
          notes.
        </p>
      </div>

      {/* 1. Prerequisites */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Prerequisites</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Before deploying, make sure you have the following:
        </p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              label: "Node.js 20+",
              desc: "Required for local development. Docker builds handle this automatically.",
            },
            {
              label: "PostgreSQL database",
              desc: "Used by Better Auth for user accounts. Any PostgreSQL 14+ instance works — Supabase, Neon, Railway, or self-hosted.",
            },
            {
              label: "Supabase instance",
              desc: "Used for project data storage (extractions and DESIGN.md content). Can be self-hosted or Supabase Cloud.",
            },
            {
              label: "Anthropic API key",
              desc: "Required for DESIGN.md generation and the test panel. Get one at console.anthropic.com.",
            },
            {
              label: "Figma Personal Access Token",
              desc: "Optional. Only needed if you want to extract design systems from Figma files.",
            },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-4 px-5 py-4">
              <div className="min-w-[180px] text-sm font-semibold text-[#0a0a0a]">
                {label}
              </div>
              <div className="text-sm text-gray-600">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Clone & Configure */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Clone &amp; Configure</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Clone the repository and create your local environment file:
        </p>
        <CopyBlock
          code={`git clone https://github.com/mattthornhill/superduperaistudio.git
cd superduperaistudio
cp .env.example .env.local`}
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          Open{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            .env.local
          </code>{" "}
          and fill in the values below. Variables marked as required must be set
          before the app will start.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Variable
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Required
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "ANTHROPIC_API_KEY",
                  "Yes",
                  "Anthropic API key for Claude — used for DESIGN.md generation and the test panel.",
                ],
                [
                  "BETTER_AUTH_SECRET",
                  "Yes",
                  "Auth secret used to sign sessions. Generate with: openssl rand -base64 32",
                ],
                [
                  "DATABASE_URL",
                  "Yes",
                  "PostgreSQL connection string for Better Auth user tables.",
                ],
                [
                  "NEXT_PUBLIC_SUPABASE_URL",
                  "Yes",
                  "Supabase project URL, e.g. https://your-project.supabase.co",
                ],
                [
                  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
                  "Yes",
                  "Supabase anonymous (public) key for client-side project data access.",
                ],
                [
                  "NEXT_PUBLIC_APP_URL",
                  "No",
                  "Full URL of your deployment. Defaults to http://localhost:3000 if unset.",
                ],
                [
                  "BETTER_AUTH_URL",
                  "No",
                  "Should match NEXT_PUBLIC_APP_URL. Used by Better Auth for redirect URLs.",
                ],
                [
                  "FIGMA_DEFAULT_TOKEN",
                  "No",
                  "Figma Personal Access Token for extraction. Users can also provide their own in-app.",
                ],
                [
                  "STRIPE_SECRET_KEY",
                  "No",
                  "Only needed if you want to enable the billing / Pro tier features.",
                ],
                [
                  "STRIPE_WEBHOOK_SECRET",
                  "No",
                  "Stripe webhook signing secret. Only needed for billing.",
                ],
                [
                  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
                  "No",
                  "Stripe publishable key for client-side checkout. Only needed for billing.",
                ],
              ].map(([variable, required, description]) => (
                <tr key={variable} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-700 whitespace-nowrap pt-3.5">
                    {variable}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={
                        required === "Yes"
                          ? "inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600"
                          : "inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500"
                      }
                    >
                      {required}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Database Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Database Setup</h2>

        <h3 className="text-lg font-semibold text-[#0a0a0a]">Better Auth (PostgreSQL)</h3>
        <p className="text-base text-gray-600 leading-relaxed">
          Better Auth manages user accounts and sessions. It creates its own
          tables on first run — no migration command needed. The four tables it
          creates are:
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-1">
          {[
            "sd_aistudio_user",
            "sd_aistudio_session",
            "sd_aistudio_account",
            "sd_aistudio_verification",
          ].map((table) => (
            <p key={table} className="font-mono text-sm text-indigo-700">
              {table}
            </p>
          ))}
        </div>
        <p className="text-base text-gray-600 leading-relaxed">
          Your{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            DATABASE_URL
          </code>{" "}
          must point to a PostgreSQL database that the app has permission to
          create tables in. A fresh database is fine — no manual schema setup is
          required.
        </p>
        <Callout type="warning">
          Port 5432 must be accessible from your app server. If you are using a
          self-hosted PostgreSQL instance, check your firewall rules to ensure
          the port is open for inbound connections from the app.
        </Callout>

        <h3 className="text-lg font-semibold text-[#0a0a0a]">Supabase (project data)</h3>
        <p className="text-base text-gray-600 leading-relaxed">
          Supabase stores extraction results and DESIGN.md content per project.
          You need a{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            projects
          </code>{" "}
          table — run the migration from{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            supabase/migrations/
          </code>{" "}
          in the repo, or apply it manually via the Supabase SQL editor.
        </p>
        <Callout type="info">
          If you are running a self-hosted Supabase instance, do not add the{" "}
          <code className="text-xs bg-indigo-50 rounded px-1 py-0.5">ssl</code>{" "}
          option to your connection config. Self-hosted Supabase does not use
          SSL by default. The standard connection string without SSL options is
          correct.
        </Callout>
      </section>

      {/* 4. Docker Deployment */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Docker Deployment</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The recommended way to deploy is via Docker. The included Dockerfile
          is a multi-stage build:{" "}
          <strong className="font-semibold text-[#0a0a0a]">deps</strong> installs
          node modules,{" "}
          <strong className="font-semibold text-[#0a0a0a]">builder</strong> runs{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            next build
          </code>
          , and{" "}
          <strong className="font-semibold text-[#0a0a0a]">runner</strong>{" "}
          produces the final slim image with Playwright Chromium pre-installed.
        </p>
        <Callout type="warning">
          <code className="text-xs bg-amber-50 rounded px-1 py-0.5">
            NEXT_PUBLIC_*
          </code>{" "}
          variables are baked into the client JavaScript bundle at build time.
          They must be passed as{" "}
          <code className="text-xs bg-amber-50 rounded px-1 py-0.5">
            --build-arg
          </code>{" "}
          values during{" "}
          <code className="text-xs bg-amber-50 rounded px-1 py-0.5">
            docker build
          </code>
          , not set as runtime environment variables. All other variables (API
          keys, secrets) are runtime only and should be passed via{" "}
          <code className="text-xs bg-amber-50 rounded px-1 py-0.5">
            --env-file
          </code>
          .
        </Callout>
        <CopyBlock
          code={`docker build \\
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-supabase.example.com \\
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \\
  --build-arg NEXT_PUBLIC_APP_URL=https://studio.yourdomain.com \\
  -t superduper-studio .

docker run -d \\
  --env-file .env.local \\
  -p 3000:3000 \\
  superduper-studio`}
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          The container exposes port{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            3000
          </code>
          . Put Nginx, Caddy, or a load balancer in front of it to handle TLS
          termination.
        </p>
      </section>

      {/* 5. Platform Notes */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Platform Notes</h2>

        {/* Coolify */}
        <div className="rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-base font-semibold text-[#0a0a0a]">Coolify</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Connect your GitHub repo and set the branch to{" "}
            <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
              main
            </code>
            . Coolify auto-detects the Dockerfile. In the{" "}
            <strong className="font-medium text-[#0a0a0a]">
              Environment Variables
            </strong>{" "}
            section, add the{" "}
            <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
              NEXT_PUBLIC_*
            </code>{" "}
            vars and enable the{" "}
            <strong className="font-medium text-[#0a0a0a]">
              Build Arg
            </strong>{" "}
            toggle for each one. All other vars can be added as regular runtime
            environment variables.
          </p>
        </div>

        {/* Railway */}
        <div className="rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-base font-semibold text-[#0a0a0a]">Railway</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Connect the GitHub repo — Railway detects the Dockerfile
            automatically. Add all environment variables in the{" "}
            <strong className="font-medium text-[#0a0a0a]">Variables</strong>{" "}
            tab. The{" "}
            <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
              NEXT_PUBLIC_*
            </code>{" "}
            vars must be set before the first deploy so they are available
            during the build stage.
          </p>
        </div>

        {/* VPS docker-compose */}
        <div className="rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-base font-semibold text-[#0a0a0a]">VPS (docker-compose)</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            For a self-managed VPS, use a{" "}
            <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
              docker-compose.yml
            </code>{" "}
            that passes the build args from your{" "}
            <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
              .env.local
            </code>{" "}
            file:
          </p>
          <CopyBlock
            code={`services:
  studio:
    build:
      context: .
      args:
        NEXT_PUBLIC_SUPABASE_URL: \${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: \${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_APP_URL: \${NEXT_PUBLIC_APP_URL}
    env_file: .env.local
    ports:
      - "3000:3000"
    restart: unless-stopped`}
            language="yaml"
          />
          <p className="text-sm text-gray-600 leading-relaxed">
            Run{" "}
            <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
              docker-compose up -d --build
            </code>{" "}
            from the repo root. Docker Compose reads{" "}
            <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
              .env.local
            </code>{" "}
            automatically for variable substitution in the{" "}
            <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
              args
            </code>{" "}
            block.
          </p>
        </div>
      </section>

      {/* 6. Playwright Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Playwright Setup</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Playwright is required for{" "}
          <strong className="font-semibold text-[#0a0a0a]">
            website extraction only
          </strong>
          . Figma extraction, DESIGN.md generation, and the test panel all work
          without it.
        </p>
        <Callout type="warning">
          Playwright cannot run in Vercel serverless functions. If you want
          website extraction, you must use a Docker/VPS deployment. Figma
          extraction works on Vercel without any changes.
        </Callout>
        <p className="text-base text-gray-600 leading-relaxed">
          The Dockerfile already handles Playwright installation in the runner
          stage:
        </p>
        <CopyBlock
          code={`ENV PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
RUN npx playwright install --with-deps chromium`}
          language="dockerfile"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          If you are running the app without Docker (e.g. for local development
          or a bare Node.js deployment), install Chromium manually and set the
          environment variable:
        </p>
        <CopyBlock
          code={`npx playwright install --with-deps chromium
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`}
          language="bash"
        />
        <Callout type="info">
          The{" "}
          <code className="text-xs bg-indigo-50 rounded px-1 py-0.5">
            --with-deps
          </code>{" "}
          flag installs the required OS-level dependencies (libnss3, libatk,
          etc.) alongside Chromium. This is needed on headless Linux servers.
          On macOS for local development, you can omit it.
        </Callout>
      </section>

      {/* 7. Stripe (Optional) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Stripe (Optional)</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Stripe integration is entirely optional. If you are running a
          personal or internal instance with no billing requirement, leave all{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            STRIPE_*
          </code>{" "}
          environment variables unset — the app starts and runs normally without
          them.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          If you want to enable the billing / Pro tier:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-600 text-base">
          <li>
            Create your products and prices in the{" "}
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              Stripe Dashboard
            </a>
            .
          </li>
          <li>
            Set{" "}
            <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
              STRIPE_SECRET_KEY
            </code>{" "}
            and{" "}
            <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
            </code>{" "}
            in your environment.
          </li>
          <li>
            Create a webhook endpoint in the Stripe Dashboard pointing to{" "}
            <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
              https://studio.yourdomain.com/api/webhooks/stripe
            </code>
            , then set{" "}
            <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
              STRIPE_WEBHOOK_SECRET
            </code>{" "}
            to the signing secret.
          </li>
        </ol>
        <Callout type="info">
          For local Stripe webhook testing, use the Stripe CLI:{" "}
          <code className="text-xs bg-indigo-50 rounded px-1 py-0.5">
            stripe listen --forward-to localhost:3000/api/webhooks/stripe
          </code>
          . This forwards live events to your local instance without needing a
          public URL.
        </Callout>
      </section>

      {/* 8. Verify Your Deployment */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Verify Your Deployment</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Once deployed, run through these checks to confirm everything is
          working:
        </p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              step: "1",
              label: "Marketing page loads",
              desc: "Visit the root URL. You should see the marketing homepage, not an error or blank screen.",
            },
            {
              step: "2",
              label: "Auth is working",
              desc: 'Visit /api/auth — Better Auth should return a JSON response. A 404 means the auth route is not registered.',
            },
            {
              step: "3",
              label: "Website extraction works",
              desc: 'Sign in, click "Extract now", enter a URL, and start extraction. Progress events should stream in.',
            },
            {
              step: "4",
              label: "DESIGN.md generates",
              desc: "After extraction completes, click Generate. The editor panel should stream in the DESIGN.md content.",
            },
            {
              step: "5",
              label: "Test panel responds",
              desc: "Open the test panel, type a prompt, and send it. You should get a streamed response from Claude.",
            },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex gap-4 px-5 py-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 mt-0.5">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a0a0a]">{label}</p>
                <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Callout type="warning">
          If website extraction fails with a timeout or browser error, Playwright
          is likely not installed correctly. Check the container logs for{" "}
          <code className="text-xs bg-amber-50 rounded px-1 py-0.5">
            PLAYWRIGHT_BROWSERS_PATH
          </code>{" "}
          errors and confirm that{" "}
          <code className="text-xs bg-amber-50 rounded px-1 py-0.5">
            npx playwright install --with-deps chromium
          </code>{" "}
          ran successfully during the build.
        </Callout>
      </section>

      {/* Prev / Next */}
      <nav className="flex items-center justify-between border-t border-gray-200 pt-8">
        <div>
          {prev && (
            <Link
              href={prev.href}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
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
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
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
