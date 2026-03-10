"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

interface DocsShellProps {
  children: React.ReactNode;
}

export function DocsShell({ children }: DocsShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 px-6 h-14">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-1.5 rounded-md text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="font-black text-black tracking-tight text-lg">
            SuperDuper
          </Link>

          <span className="text-gray-300 hidden sm:block">|</span>

          <Link
            href="/"
            className="hidden sm:block text-sm text-gray-500 hover:text-black transition-colors"
          >
            Back to SuperDuper
          </Link>

          <div className="ml-auto">
            <Link
              href="/"
              className="sm:hidden text-sm text-gray-500 hover:text-black transition-colors"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-gray-200 px-6 py-8">
          <DocsSidebar />
        </aside>

        {/* Sidebar — mobile overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-20 bg-black/30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed top-14 left-0 bottom-0 z-30 w-64 bg-white border-r border-gray-200 overflow-y-auto px-6 py-8 lg:hidden">
              <DocsSidebar />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-8 py-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
