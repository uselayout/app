"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Users, Mail, Shield } from "lucide-react";

export default function MembersPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const user = session?.user;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-[var(--studio-accent)]" />
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Members
        </h1>
      </div>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Invite team members and manage roles
      </p>

      {/* Invite form */}
      <div className="mt-8 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Invite a member
        </p>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            disabled
            className="rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Invite
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">
          Invitations coming soon. Team members will receive an email to join
          your organisation.
        </p>
      </div>

      {/* Current members */}
      <div className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)]">
        <div className="border-b border-[var(--studio-border)] px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Current members
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--studio-accent)] text-xs font-bold text-[var(--text-on-accent)]">
              {(user.name || user.email || "U")
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {user.name || "You"}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-panel)] px-2.5 py-1">
              <Shield className="h-3 w-3 text-[var(--studio-accent)]" />
              <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                Owner
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
