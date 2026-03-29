import type { Metadata } from "next";
import Link from "next/link";
import { draftEntries, publishedWeeks } from "@/content/changelog";
import type { ChangelogWeek } from "@/lib/types/changelog";
import { ChangelogClient } from "@/components/changelog/ChangelogClient";

export const metadata: Metadata = {
  title: "Changelog | Layout",
  description: "What's new in Layout",
};

function getISOWeekLabel(): { weekId: string; label: string } {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000
  );
  const weekNum = Math.ceil((dayOfYear + jan4.getDay() + 1) / 7);
  const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const label = `Week of ${monday.getDate()} ${monday.toLocaleString("en-GB", { month: "long" })} ${monday.getFullYear()}`;

  return { weekId, label };
}

export default function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ChangelogPageInner searchParams={searchParams} />;
}

async function ChangelogPageInner({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const showDraft =
    params.draft === "true" || process.env.NODE_ENV === "development";

  let draftWeek: ChangelogWeek | null = null;
  if (showDraft && draftEntries.length > 0) {
    const { weekId, label } = getISOWeekLabel();
    draftWeek = {
      weekId,
      label,
      summary: "Draft entries for the current week.",
      items: draftEntries.map((e) => ({
        text: e.title,
        product: e.product,
        category: e.category,
      })),
    };
  }

  return (
    <div className="min-h-screen bg-[#080705] text-white">
      <header className="mx-auto flex max-w-[720px] items-center px-6 pt-12">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <img
            src="/marketing/logo-white.svg"
            alt="Layout"
            className="h-5"
          />
        </Link>
      </header>

      <main className="mx-auto max-w-[720px] px-6 pb-32 pt-24">
        <h1 className="text-4xl font-black tracking-tight text-white">
          Changelog
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/60">
          New updates and improvements across Layout Studio, CLI, Figma Plugin,
          and Chrome Extension.
        </p>

        <ChangelogClient weeks={publishedWeeks} draftWeek={draftWeek} />
      </main>
    </div>
  );
}
