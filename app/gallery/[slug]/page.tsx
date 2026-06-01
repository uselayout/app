import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { fetchKitBySlug, fetchRelatedKits, hasUpvoted } from "@/lib/supabase/kits";
import { KitCard } from "@/components/gallery/KitCard";
import { auth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/supabase/organization";
import { KitDetailImportButton } from "@/components/gallery/KitDetailClient";
import { GalleryThemeInit } from "@/components/gallery/GalleryThemeInit";
import { Avatar } from "@/components/gallery/Avatar";
import { UpvoteButton } from "@/components/gallery/UpvoteButton";
import { CopyInline } from "@/components/gallery/CopyInline";
import { KitDetailTabs } from "@/components/gallery/KitDetailTabs";
import { KitShowcaseFrame } from "@/components/gallery/KitShowcaseFrame";
import { ShareButton } from "@/components/gallery/ShareButton";
import { getKitShowcaseJs } from "@/components/gallery/kit-showcase-compiled";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ snapshot?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const kit = await fetchKitBySlug(slug);
  if (!kit) return { title: "Kit not found - Layout" };
  return {
    title: `${kit.name} - Layout Kit Gallery`,
    description: kit.description ?? `${kit.name} design-system kit. Import into Layout Studio with one click.`,
    openGraph: {
      title: kit.name,
      description: kit.description,
      images: kit.previewImageUrl ? [{ url: kit.previewImageUrl }] : undefined,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function KitDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { snapshot } = await searchParams;
  const kit = await fetchKitBySlug(slug);
  if (!kit) notFound();

  const isSnapshot = snapshot === "1";
  // Uniform template by default. Bespoke (Claude-generated) only when the
  // kit has been opted in AND has cached output. Admin can flip a kit back
  // to uniform without losing the cached blob.
  const showcaseJs =
    kit.bespokeShowcase && kit.showcaseCustomJs
      ? kit.showcaseCustomJs
      : await getKitShowcaseJs();

  // Orphan detection. After the Studio publish modal stopped accepting
  // bespoke=true at publish, this state should only happen if a kit was
  // published before that change and never had regen-bespoke run on it.
  if (kit.bespokeShowcase && !kit.showcaseCustomJs) {
    console.warn(
      `[gallery] kit ${kit.slug} (${kit.id}) has bespoke_showcase=true but no showcase_custom_js — falling back to uniform. Run scripts/regen-bespoke.ts for this slug, or flip bespoke_showcase=false in the DB.`,
    );
  }

  // Kit metadata exposed to the uniform showcase iframe via window.__KIT__.
  // The Hero in kit-showcase-source.ts reads this to render a logo + name +
  // description block matching the bespoke Notion-style design. Bespoke
  // showcases ignore it because they hard-code their own hero.
  const primaryLogo = kit.richBundle?.brandingAssets?.find(
    (a) => /^(logo|primary|wordmark|mark)$/i.test(a.slot),
  )?.url;
  const kitMeta = {
    name: kit.name,
    description: kit.description,
    logoUrl: primaryLogo,
    styleProfile: kit.styleProfile,
  };

  // Snapshot mode: render only the showcase iframe at full size, no chrome.
  // Used by Playwright to capture the card thumbnail (lib/gallery/snapshot.ts).
  if (isSnapshot) {
    return (
      <main className="min-h-screen bg-[var(--mkt-bg)]" data-mkt-theme="light">
        <div className="max-w-[1280px] mx-auto">
          <KitShowcaseFrame showcaseJs={showcaseJs} tokensCss={kit.tokensCss} kit={kitMeta} height={900} />
        </div>
      </main>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user?.id;
  let currentOrgSlug: string | undefined;
  let initiallyUpvoted = false;
  if (session?.user?.id) {
    const orgs = await getUserOrganizations(session.user.id);
    currentOrgSlug = orgs[0]?.slug;
    initiallyUpvoted = await hasUpvoted(kit.id, session.user.id);
  }

  const relatedKits = await fetchRelatedKits(kit.slug, kit.tags, 3);

  // Display host for the "Visit pinterest.com" pill. `kit.homepageUrl` is
  // validated as a URL by the admin PATCH route, but defend against legacy
  // rows or hand-edited DB values by falling back to no pill on parse failure.
  let homepageHost: string | null = null;
  if (kit.homepageUrl) {
    try {
      homepageHost = new URL(kit.homepageUrl).hostname.replace(/^www\./, "");
    } catch {
      homepageHost = null;
    }
  }

  return (
    <main className="min-h-screen bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)]">
      <GalleryThemeInit />
      <section className="pt-[40px] pb-8 lg:pt-[60px]">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="flex flex-col gap-5 mb-8">
            <Link href="/" aria-label="Layout home" className="self-start">
              <img src="/marketing/logo.svg" alt="Layout" width={99} height={24} className="mkt-logo" />
            </Link>
            <Link
              href="/gallery"
              className="self-start inline-flex items-center gap-1.5 text-[13px] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)]"
            >
              ← Back to gallery
            </Link>
          </div>

          <div className="flex flex-col gap-6 min-w-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-[36px] leading-[40px] font-normal tracking-[-0.9px]">{kit.name}</h1>
                <div className="flex shrink-0 items-center gap-2">
                  <UpvoteButton
                    slug={kit.slug}
                    initialCount={kit.upvoteCount}
                    initiallyUpvoted={initiallyUpvoted}
                    isLoggedIn={isLoggedIn}
                  />
                  <ShareButton name={kit.name} description={kit.description} />
                  {homepageHost && kit.homepageUrl && (
                    <a
                      href={kit.homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)] transition-colors px-2 py-1 rounded-full border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)]"
                    >
                      Visit {homepageHost}
                      <span aria-hidden>↗</span>
                    </a>
                  )}
                  <span className="text-[12px] text-[var(--mkt-text-secondary)] px-2 py-1 rounded-full border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)]">
                    {kit.licence}
                  </span>
                </div>
              </div>
              {kit.description && (
                <p className="text-[16px] leading-[24px] text-[var(--mkt-text-secondary)]">{kit.description}</p>
              )}

              <div className="flex items-center gap-2 mt-1">
                <Avatar src={kit.author.avatarUrl} name={kit.author.displayName} size={20} />
                <span className="text-[13px] text-[var(--mkt-text-secondary)]">
                  Published by {kit.author.displayName ?? "Layout community"}
                </span>
                <span aria-hidden className="text-[var(--mkt-text-muted)] opacity-40">·</span>
                <span className="text-[13px] text-[var(--mkt-text-muted)]">{kit.importCount} imports</span>
                <span aria-hidden className="text-[var(--mkt-text-muted)] opacity-40">·</span>
                <span className="text-[13px] text-[var(--mkt-text-muted)] capitalize">{kit.tier} tier</span>
              </div>

              {kit.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {kit.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/gallery?tag=${encodeURIComponent(tag)}`}
                      className="px-2 py-0.5 rounded-full border border-[var(--mkt-border)] text-[11px] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)]"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-4">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-[12px] uppercase tracking-wide text-[var(--mkt-text-muted)]">Use this kit</span>
                <span className="text-[13px] text-[var(--mkt-text-secondary)]">
                  Import into Layout Studio, or run it from the CLI in any project.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <CopyInline
                  value={`npx @layoutdesign/context install ${kit.slug}`}
                  label="Copy install command"
                />
                <KitDetailImportButton
                  slug={kit.slug}
                  kitId={kit.id}
                  isLoggedIn={isLoggedIn}
                  currentOrgSlug={currentOrgSlug}
                />
              </div>
            </div>

            <KitDetailTabs
              preview={
                <KitShowcaseFrame
                  showcaseJs={showcaseJs}
                  tokensCss={kit.tokensCss}
                  kit={kitMeta}
                  fillViewport
                />
              }
              layoutMd={
                <pre className="max-h-[700px] overflow-auto rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface-muted)] p-5 text-[12px] leading-[18px] font-mono text-[var(--mkt-text-secondary)] whitespace-pre-wrap">
                  {kit.layoutMd}
                </pre>
              }
            />
          </div>

          {relatedKits.length > 0 && (
            <section className="mt-20 pt-10 border-t border-[var(--mkt-border)]">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--mkt-text-muted)]">More from the gallery</span>
                  <h2 className="text-[24px] leading-[28px] font-normal tracking-[-0.4px]">You may also like</h2>
                </div>
                <Link
                  href="/gallery"
                  className="text-[13px] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)]"
                >
                  Browse all kits →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedKits.map((related) => (
                  <KitCard key={related.id} kit={related} />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
