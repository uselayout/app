import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listKitRequests } from "@/lib/supabase/kit-requests";
import { KitRequestList } from "./KitRequestList";
import { KitRequestSubmitForm } from "./KitRequestSubmitForm";

export async function KitRequestSection() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const requests = await listKitRequests({ userId, limit: 50 });
  const isLoggedIn = !!userId;

  return (
    <section className="mt-24 pt-16 border-t border-[var(--mkt-border-strong)]">
      <div className="flex flex-col gap-2 max-w-[640px] mb-8">
        <h2 className="text-[28px] md:text-[32px] leading-[34px] md:leading-[38px] tracking-[-0.6px] font-normal">
          Wishlist
        </h2>
        <p className="text-[15px] leading-[22px] text-[var(--mkt-text-secondary)]">
          Want a kit added to the gallery? Drop the URL below. Upvote the ones you&apos;d use.
        </p>
      </div>

      <KitRequestSubmitForm isLoggedIn={isLoggedIn} />
      <KitRequestList initialRequests={requests} isLoggedIn={isLoggedIn} />
    </section>
  );
}
