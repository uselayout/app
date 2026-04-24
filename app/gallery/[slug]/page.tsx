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
import { UpvoteButton } from "@/components/gallery/UpvoteButton";
import { CopyInline } from "@/components/gallery/CopyInline";
import { KitDetailTabs } from "@/components/gallery/KitDetailTabs";
import { KitShowcaseFrame } from "@/components/gallery/KitShowcaseFrame";
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

type FlatToken = { name: string; value: string; type: string; group: string };

function walkTokens(node: unknown, path: string[] = []): FlatToken[] {
  if (!node || typeof node !== "object") return [];
  const obj = node as Record<string, unknown>;
  if ("$value" in obj) {
    const raw = obj["$value"];
    const type = typeof obj["$type"] === "string" ? (obj["$type"] as string) : "";
    const value = Array.isArray(raw) ? raw.join(", ") : typeof raw === "object" ? JSON.stringify(raw) : String(raw);
    return [{ name: path.join("."), value, type, group: path[0] ?? "" }];
  }
  return Object.entries(obj).flatMap(([k, v]) => (k.startsWith("$") ? [] : walkTokens(v, [...path, k])));
}

function groupTokens(tokens: FlatToken[]) {
  const colour = tokens.filter((t) => t.type === "color");
  const typography = tokens.filter((t) => ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"].includes(t.type));
  const spacing = tokens.filter((t) => t.type === "dimension" && /spacing|gap|space|size/i.test(t.group));
  const radius = tokens.filter((t) => t.type === "dimension" && /radius|rounded|border/i.test(t.group));
  const shadow = tokens.filter((t) => t.type === "shadow" || t.type === "boxShadow");
  return { colour, typography, spacing, radius, shadow };
}

export default async function KitDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { snapshot } = await searchParams;
  const kit = await fetchKitBySlug(slug);
  if (!kit) notFound();

  const isSnapshot = snapshot === "1";
  const showcaseJs = kit.showcaseCustomJs ?? getKitShowcaseJs();

  // Snapshot mode: render only the showcase iframe at full size, no chrome.
  // Used by Playwright to capture the card thumbnail (lib/gallery/snapshot.ts).
  if (isSnapshot) {
    return (
      <main className="min-h-screen bg-[var(--mkt-bg)]" data-mkt-theme="light">
        <div className="max-w-[1280px] mx-auto">
          <KitShowcaseFrame showcaseJs={showcaseJs} tokensCss={kit.tokensCss} height={900} />
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

  const flatTokens = walkTokens(kit.tokensJson);
  const grouped = groupTokens(flatTokens);
  const hasAnyTokens =
    grouped.colour.length > 0 ||
    grouped.typography.length > 0 ||
    grouped.spacing.length > 0 ||
    grouped.radius.length > 0 ||
    grouped.shadow.length > 0;

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

              <div className="mt-4">
                <KitDetailTabs
                  preview={
                    <KitShowcaseFrame
                      showcaseJs={showcaseJs}
                      tokensCss={kit.tokensCss}
                      height={900}
                    />
                  }
                  tokens={
                    hasAnyTokens ? (
                      <div className="flex flex-col gap-4">
                        {grouped.colour.length > 0 && (
                          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-5">
                            <h2 className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)]">Colour ({grouped.colour.length})</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {grouped.colour.slice(0, 48).map((s) => (
                                <div key={s.name} className="flex items-center gap-2 rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-bg)] px-2 py-1.5">
                                  <span className="w-6 h-6 rounded border border-[var(--mkt-border)] shrink-0" style={{ background: s.value }} />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] text-[var(--mkt-text-primary)] font-mono truncate">{s.name}</span>
                                    <span className="text-[10px] text-[var(--mkt-text-muted)] font-mono truncate">{s.value}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {grouped.typography.length > 0 && (
                          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-5">
                            <h2 className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)]">Typography ({grouped.typography.length})</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {grouped.typography.map((t) => (
                                <div key={t.name} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-bg)] px-3 py-2">
                                  <span className="text-[11px] text-[var(--mkt-text-primary)] font-mono truncate">{t.name}</span>
                                  <span className="text-[11px] text-[var(--mkt-text-muted)] font-mono truncate text-right">{t.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {grouped.spacing.length > 0 && (
                          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-5">
                            <h2 className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)]">Spacing ({grouped.spacing.length})</h2>
                            <div className="flex flex-col gap-1.5">
                              {grouped.spacing.map((s) => (
                                <div key={s.name} className="flex items-center gap-3">
                                  <span className="text-[11px] text-[var(--mkt-text-primary)] font-mono w-40 shrink-0 truncate">{s.name}</span>
                                  <span className="h-2 rounded bg-[var(--mkt-accent)]" style={{ width: s.value }} />
                                  <span className="text-[11px] text-[var(--mkt-text-muted)] font-mono">{s.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {grouped.radius.length > 0 && (
                          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-5">
                            <h2 className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)]">Radius ({grouped.radius.length})</h2>
                            <div className="flex flex-wrap gap-3">
                              {grouped.radius.map((r) => (
                                <div key={r.name} className="flex flex-col items-center gap-1.5">
                                  <span className="w-14 h-14 bg-[var(--mkt-accent)]" style={{ borderRadius: r.value }} />
                                  <span className="text-[10px] text-[var(--mkt-text-primary)] font-mono">{r.name.split(".").pop()}</span>
                                  <span className="text-[10px] text-[var(--mkt-text-muted)] font-mono">{r.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {grouped.shadow.length > 0 && (
                          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-5">
                            <h2 className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)]">Shadow ({grouped.shadow.length})</h2>
                            <div className="flex flex-col gap-2">
                              {grouped.shadow.map((s) => (
                                <div key={s.name} className="flex items-center justify-between gap-3">
                                  <span className="text-[11px] text-[var(--mkt-text-primary)] font-mono">{s.name}</span>
                                  <span className="text-[11px] text-[var(--mkt-text-muted)] font-mono truncate max-w-[60%] text-right">{s.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[13px] text-[var(--mkt-text-muted)]">No tokens declared.</p>
                    )
                  }
                  layoutMd={
                    <pre className="max-h-[700px] overflow-auto rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface-muted)] p-5 text-[12px] leading-[18px] font-mono text-[var(--mkt-text-secondary)] whitespace-pre-wrap">
                      {kit.layoutMd}
                    </pre>
                  }
                />
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
