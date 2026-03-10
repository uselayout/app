"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { docsNavigation, type DocNavItem } from "@/lib/docs/navigation";

function hasActiveChild(item: DocNavItem, pathname: string): boolean {
  return item.children?.some((child) => child.href === pathname) ?? false;
}

function NavItem({ item }: { item: DocNavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const childActive = hasActiveChild(item, pathname);
  const hasChildren = !!item.children?.length;

  const [open, setOpen] = useState(childActive);

  // Auto-expand when a child becomes active (e.g. on initial render)
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <li>
      <div className="flex items-center gap-1">
        <Link
          href={item.href}
          className={[
            "flex-1 py-1.5 text-sm transition-colors duration-150",
            isActive
              ? "text-indigo-600 font-medium"
              : "text-gray-600 hover:text-black",
          ].join(" ")}
        >
          {item.title}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Collapse section" : "Expand section"}
            className="p-0.5 text-gray-400 hover:text-gray-700 transition-colors duration-150"
          >
            <ChevronRight
              size={14}
              className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>

      {hasChildren && open && (
        <ul className="pl-4 mt-0.5">
          {item.children!.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className={[
                  "block py-1.5 text-sm transition-colors duration-150",
                  pathname === child.href
                    ? "text-indigo-600 font-medium"
                    : "text-gray-600 hover:text-black",
                ].join(" ")}
              >
                {child.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function DocsSidebar() {
  return (
    <nav aria-label="Docs navigation">
      <ul className="space-y-0.5">
        {docsNavigation.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </ul>
    </nav>
  );
}
