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

          <Link href="/" className="flex items-center">
            <svg width="99" height="24" viewBox="0 0 99 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.7168 2.72069C16.3906 2.72069 18.5586 4.88866 18.5586 7.56248V21.2793H0V2.72069H13.7168ZM1.61426 19.665H5.64844V15.6308H1.61426V19.665ZM7.26172 15.6308V19.665H16.9453V15.6308H7.26172ZM1.61426 14.0176H5.64844V4.33495H1.61426V14.0176Z" fill="#18181B"/>
              <path d="M98.4298 16.6953V19.3901C97.6726 19.7686 96.9599 19.9245 96.0469 19.9245C93.5971 19.9245 92.0605 18.5215 92.0605 15.8491V10.4596H89.6553V7.80947H92.0605V4.29076H95.1338V7.80947H98.5411V10.4596H95.1338V15.1364C95.1338 16.5172 95.7574 17.0739 96.8709 17.0739C97.4499 17.0739 97.9844 16.9403 98.4298 16.6953Z" fill="#18181B"/>
              <path d="M85.1812 14.691V7.80946H88.2546V19.7018H85.4262V18.1429C84.7804 19.1896 83.4664 19.9245 81.952 19.9245C79.5691 19.9245 77.832 18.477 77.832 15.3814V7.80946H80.9276V14.7801C80.9276 16.4504 81.7516 17.1853 82.9988 17.1853C84.1123 17.1853 85.1812 16.2945 85.1812 14.691Z" fill="#18181B"/>
              <path d="M70.378 19.9245C66.9261 19.9245 64.3428 17.2076 64.3428 13.7556C64.3428 10.2815 66.9261 7.58676 70.378 7.58676C73.8299 7.58676 76.4133 10.2815 76.4133 13.7556C76.4133 17.2076 73.8299 19.9245 70.378 19.9245ZM70.378 17.1853C71.9147 17.1853 73.2286 15.9604 73.2286 13.7556C73.2286 11.5509 71.9147 10.3483 70.378 10.3483C68.8414 10.3483 67.5274 11.5509 67.5274 13.7556C67.5274 15.9604 68.8414 17.1853 70.378 17.1853Z" fill="#18181B"/>
              <path d="M64.6227 7.80946L58.8324 24H55.4696L57.1621 19.5682L52.4854 7.80946H55.8259L58.8101 15.9604L61.5271 7.80946H64.6227Z" fill="#18181B"/>
              <path d="M49.5854 19.7018V18.232C48.806 19.3455 47.6256 19.9245 45.9999 19.9245C43.5279 19.9245 41.8799 18.477 41.8799 16.2499C41.8799 13.9338 43.7506 12.6867 47.2248 12.6867C47.8929 12.6867 48.4719 12.7312 49.2068 12.8203V12.1076C49.2068 10.7714 48.4496 9.99196 47.158 9.99196C45.8217 9.99196 45.02 10.7714 44.9087 12.1076H42.1249C42.303 9.36839 44.2851 7.58676 47.158 7.58676C50.2758 7.58676 52.102 9.30158 52.102 12.219V19.7018H49.5854ZM44.7973 16.1608C44.7973 17.163 45.5099 17.7866 46.668 17.7866C48.2492 17.7866 49.2068 16.918 49.2068 15.5373V14.691C48.4719 14.5797 47.9597 14.5351 47.4252 14.5351C45.6658 14.5351 44.7973 15.0919 44.7973 16.1608Z" fill="#18181B"/>
              <path d="M40.892 19.7018H30.5586V3.71173H33.9437V16.6508H40.892V19.7018Z" fill="#18181B"/>
            </svg>
          </Link>

          <span className="text-gray-300 hidden sm:block">|</span>

          <Link
            href="/"
            className="hidden sm:block text-sm text-gray-500 hover:text-black transition-colors"
          >
            Back to Layout
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
