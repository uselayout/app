"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, Settings, CreditCard, Sun, Moon, Monitor, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { Avatar } from "@/components/gallery/Avatar";

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const openOnboardingModal = useOnboardingStore((s) => s.openModal);
  const resetOnboardingDismissal = useOnboardingStore((s) => s.resurface);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const user = session?.user;
  if (!user) return null;

  const avatarUrl = "image" in user ? ((user.image as string | null | undefined) ?? undefined) : undefined;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center gap-2.5 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Avatar src={avatarUrl} name={user.name ?? user.email} size={24} className="shrink-0" />
        {!collapsed && (
          <span className="truncate text-[var(--text-secondary)]">
            {user.name || user.email}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] py-1 shadow-lg ${
            collapsed
              ? "left-full ml-2 w-48"
              : "left-0 right-0"
          }`}
          style={collapsed
            ? { bottom: 0 }
            : { bottom: "100%", marginBottom: 4 }
          }
        >
          <div className="px-3 py-2 border-b border-[var(--studio-border)]">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
              {user.name || "User"}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] truncate">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/${orgSlug}/settings`);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/${orgSlug}/settings/billing`);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Billing
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              resetOnboardingDismissal();
              openOnboardingModal();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Show getting started
          </button>

          <div className="my-1 border-t border-[var(--studio-border)]" />

          <div className="px-3 py-2">
            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Theme
            </p>
            <div className="flex gap-1 rounded-[var(--studio-radius-md)] bg-[var(--bg-surface)] p-0.5">
              {([
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "system", icon: Monitor, label: "System" },
              ] as const).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  title={label}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-[var(--studio-radius-sm)] px-2 py-1 text-[11px] transition-all duration-[var(--duration-base)] ${
                    theme === value
                      ? "bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 border-t border-[var(--studio-border)]" />

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--status-error)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
