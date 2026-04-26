import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listKitRequests } from "@/lib/supabase/kit-requests";
import { KitRequestList } from "@/components/gallery/KitRequestList";
import { KitRequestSubmitForm } from "@/components/gallery/KitRequestSubmitForm";

export const metadata: Metadata = {
  title: "Kit Wishlist - Layout",
  description:
    "Suggest kits you'd like to see in the Layout gallery and upvote others' nominations.",
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const requests = await listKitRequests({ userId, limit: 100 });
  const isLoggedIn = !!userId;

  return (
    <main className="min-h-screen bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)]">
      <section className="pt-[60px] pb-12 lg:pt-[100px] lg:pb-12">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="inline-flex" aria-label="Layout home">
              <img
                src="/marketing/logo.svg"
                alt="Layout"
                width={99}
                height={24}
                className="mkt-logo"
              />
            </Link>
            <Link
              href="/gallery"
              className="px-4 py-2 rounded-full border border-[var(--mkt-border-strong)] text-[13px] text-[var(--mkt-text-primary)] hover:bg-[var(--mkt-surface)] transition-colors"
            >
              Back to gallery
            </Link>
          </div>

          <div className="flex flex-col gap-6 max-w-[820px]">
            <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] text-[12px] text-[var(--mkt-text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--mkt-accent)]" />
              {requests.length} on the list
            </div>

            <h1 className="text-[40px] leading-[44px] md:text-[56px] md:leading-[60px] tracking-[-1.4px] font-normal">
              Kit Wishlist
            </h1>

            <p className="text-[18px] leading-[26px] text-[var(--mkt-text-secondary)] max-w-[640px]">
              Want a kit added to the gallery? Drop the URL below. Upvote the
              ones you&apos;d use. We work through the most-wanted ones first.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-32">
        <div className="max-w-[1280px] mx-auto px-6">
          <KitRequestSubmitForm isLoggedIn={isLoggedIn} />
          <KitRequestList initialRequests={requests} isLoggedIn={isLoggedIn} />
        </div>
      </section>
    </main>
  );
}
