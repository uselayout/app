import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { fetchKitBySlug, hasUpvoted } from "@/lib/supabase/kits";
import { auth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/supabase/organization";
import { KitDetailImportButton } from "@/components/gallery/KitDetailClient";
import { GalleryThemeInit } from "@/components/gallery/GalleryThemeInit";
import { Avatar } from "@/components/gallery/Avatar";
import { KitPreview } from "@/components/gallery/KitPreview";
import { UpvoteButton } from "@/components/gallery/UpvoteButton";
import { CopyInline } from "@/components/gallery/CopyInline";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

function colourTokens(tokensJson: Record<string, unknown>): Array<{ name: string; value: string }> {
  const colours = tokensJson["color"] ?? tokensJson["colors"];
  if (!colours || typeof colours !== "object") return [];
  const out: Array<{ name: string; value: string }> = [];
  for (const [name, entry] of Object.entries(colours as Record<string, unknown>)) {
    if (entry && typeof entry === "object" && "$value" in entry) {
      const value = (entry as { $value: unknown }).$value;
      if (typeof value === "string") out.push({ name, value });
    }
  }
  return out.slice(0, 12);
}

export default async function KitDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const kit = await fetchKitBySlug(slug);
  if (!kit) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user?.id;
  let currentOrgSlug: string | undefined;
  let initiallyUpvoted = false;
  if (session?.user?.id) {
    const orgs = await getUserOrganizations(session.user.id);
    currentOrgSlug = orgs[0]?.slug;
    initiallyUpvoted = await hasUpvoted(kit.id, session.user.id);
  }

  const swatches = colourTokens(kit.tokensJson);

  return (
    <main className="min-h-screen bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)]">
      <GalleryThemeInit />
      <section className="pt-[60px] pb-8 lg:pt-[100px]">
        <div className="max-w-[1080px] mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" aria-label="Layout home">
              <img src="/marketing/logo.svg" alt="Layout" width={99} height={24} className="mkt-logo" />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-[13px] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)]"
            >
              ← Back to gallery
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl overflow-hidden border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)]">
                <KitPreview kit={kit} aspect="16/9" />
              </div>

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

              {swatches.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <h2 className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)]">Colour tokens</h2>
                  <div className="flex flex-wrap gap-2">
                    {swatches.map((s) => (
                      <div key={s.name} className="flex items-center gap-2 rounded-lg border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] px-2 py-1.5">
                        <span className="w-5 h-5 rounded border border-[var(--mkt-border)]" style={{ background: s.value }} />
                        <span className="text-[12px] text-[var(--mkt-text-secondary)] font-mono">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-4">
                <h2 className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)]">layout.md</h2>
                <pre className="max-h-[600px] overflow-auto rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface-muted)] p-5 text-[12px] leading-[18px] font-mono text-[var(--mkt-text-secondary)] whitespace-pre-wrap">
                  {kit.layoutMd}
                </pre>
              </div>
            </div>

            <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-col gap-4 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] uppercase tracking-wide text-[var(--mkt-text-muted)]">Use this kit</span>
                  <span className="text-[14px] text-[var(--mkt-text-primary)]">
                    Import into Layout Studio, or use it from the CLI in any project.
                  </span>
                </div>
                <KitDetailImportButton
                  slug={kit.slug}
                  kitId={kit.id}
                  isLoggedIn={isLoggedIn}
                  currentOrgSlug={currentOrgSlug}
                />
                <div className="flex flex-col gap-2 pt-3 border-t border-[var(--mkt-border)]">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--mkt-text-muted)]">CLI</span>
                  <CopyInline
                    value={`npx @layoutdesign/context install ${kit.slug}`}
                    label="Copy install command"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-5 text-[12px] text-[var(--mkt-text-secondary)]">
                <div className="flex justify-between"><span>Tier</span><span className="text-[var(--mkt-text-primary)]">{kit.tier}</span></div>
                <div className="flex justify-between"><span>Published</span><span className="text-[var(--mkt-text-primary)]">{new Date(kit.createdAt).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Upvotes</span><span className="text-[var(--mkt-text-primary)]">{kit.upvoteCount}</span></div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
