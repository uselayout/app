"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { useOrgStore } from "@/lib/store/organization";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Users,
  Mail,
  Shield,
  Trash2,
  Clock,
  Loader2,
  Check,
} from "lucide-react";
import type { OrgMember, OrgInvitation, OrgRole } from "@/lib/types/organization";

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_COLOURS: Record<OrgRole, string> = {
  owner: "text-[var(--studio-accent)]",
  admin: "text-blue-400",
  editor: "text-emerald-400",
  viewer: "text-[var(--text-muted)]",
};

function initials(name?: string, email?: string): string {
  const source = name || email || "U";
  return source
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MembersPage() {
  const { data: session } = useSession();
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const hasPermission = useOrgStore((s) => s.hasPermission);
  const activeOrg = currentOrg();
  const canManage = hasPermission("manageMembers");

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatCount, setSeatCount] = useState<number | null>(null);
  const [isTeam, setIsTeam] = useState(false);

  // Invite form
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Confirm modals
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<OrgInvitation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const orgId = activeOrg?.id;

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    const [membersRes, invitationsRes, subRes] = await Promise.all([
      fetch(`/api/organizations/${orgId}/members`),
      canManage
        ? fetch(`/api/organizations/${orgId}/invitations`)
        : Promise.resolve(null),
      fetch("/api/billing/subscription"),
    ]);

    if (membersRes.ok) {
      const data = await membersRes.json();
      setMembers(data);
    }

    if (invitationsRes?.ok) {
      const data = await invitationsRes.json();
      setInvitations(data);
    }

    if (subRes.ok) {
      const data = await subRes.json();
      if (data.subscription) {
        setSeatCount(data.subscription.seatCount);
        setIsTeam(data.subscription.tier === "team");
      }
    }

    setLoading(false);
  }, [orgId, canManage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Invite ────────────────────────────────────────────────────────────────

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !email.trim()) return;

    setInviting(true);
    setInviteError("");
    setInviteSuccess(false);

    const res = await fetch(`/api/organizations/${orgId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });

    if (res.ok) {
      setEmail("");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
      fetchData();
    } else {
      const data = await res.json().catch(() => ({}));
      setInviteError(
        (data as { error?: string }).error || "Failed to send invitation"
      );
    }

    setInviting(false);
  }

  // ─── Role change ──────────────────────────────────────────────────────────

  async function handleRoleChange(member: OrgMember, newRole: OrgRole) {
    if (!orgId || newRole === member.role) return;

    const res = await fetch(
      `/api/organizations/${orgId}/members/${member.userId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      }
    );

    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === member.userId ? { ...m, role: newRole } : m
        )
      );
    }
  }

  // ─── Remove member ────────────────────────────────────────────────────────

  async function handleRemove() {
    if (!orgId || !removeTarget) return;
    setRemoving(true);

    const res = await fetch(
      `/api/organizations/${orgId}/members/${removeTarget.userId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setMembers((prev) =>
        prev.filter((m) => m.userId !== removeTarget.userId)
      );
    }

    setRemoving(false);
    setRemoveTarget(null);
  }

  // ─── Cancel invitation ────────────────────────────────────────────────────

  async function handleCancelInvite() {
    if (!orgId || !cancelTarget) return;
    setCancelling(true);

    const res = await fetch(
      `/api/organizations/${orgId}/invitations/${cancelTarget.id}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setInvitations((prev) =>
        prev.filter((i) => i.id !== cancelTarget.id)
      );
    }

    setCancelling(false);
    setCancelTarget(null);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const isMe = (member: OrgMember) => member.userId === session?.user?.id;
  const isOwner = (member: OrgMember) => member.role === "owner";
  const atSeatLimit = isTeam && seatCount !== null && (members.length + invitations.length) >= seatCount;

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

      {/* Seat indicator for team plans */}
      {isTeam && seatCount !== null && !loading && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <Users size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">
              {members.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {seatCount}
            </span>{" "}
            seats used
          </span>
          {members.length >= seatCount && (
            <a
              href={`/${activeOrg?.slug || ""}/settings/billing`}
              className="ml-auto text-[10px] text-[var(--studio-accent)] hover:text-[var(--studio-accent-hover)] transition-colors"
            >
              Add more seats
            </a>
          )}
        </div>
      )}

      {/* Invite form — only if user can manage members */}
      {canManage && (
        <form
          onSubmit={handleInvite}
          className="mt-8 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5"
        >
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
                required
                className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
              />
            </div>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "editor" | "viewer")
              }
              className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={inviting || !email.trim() || atSeatLimit}
              className="flex items-center gap-1.5 rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : inviteSuccess ? (
                <Check size={14} />
              ) : null}
              {inviteSuccess ? "Sent" : "Invite"}
            </button>
          </div>
          {atSeatLimit && (
            <p className="mt-2 text-xs text-[var(--status-warning)]">
              All seats are in use.{" "}
              <a
                href={`/${activeOrg?.slug || ""}/settings/billing`}
                className="underline hover:text-[var(--status-warning)]"
              >
                Add more seats
              </a>{" "}
              to invite new members.
            </p>
          )}
          {inviteError && (
            <p className="mt-2 text-xs text-red-400">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="mt-2 text-xs text-emerald-400">
              Invitation sent successfully
            </p>
          )}
        </form>
      )}

      {/* Pending invitations */}
      {canManage && invitations.length > 0 && (
        <div className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)]">
          <div className="border-b border-[var(--studio-border)] px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Pending invitations
            </p>
          </div>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 border-b border-[var(--studio-border)] px-5 py-3 last:border-b-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-[var(--studio-border-strong)] text-[var(--text-muted)]">
                <Mail size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">
                  {inv.email}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <span>{ROLE_LABELS[inv.role]}</span>
                  <span>&middot;</span>
                  <Clock size={10} className="inline" />
                  <span>
                    Expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCancelTarget(inv)}
                className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-red-400"
                title="Cancel invitation"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current members */}
      <div
        className={`rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] ${
          canManage ? "mt-4" : "mt-8"
        }`}
      >
        <div className="border-b border-[var(--studio-border)] px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Members{" "}
            {!loading && (
              <span className="text-[var(--text-muted)]">
                ({members.length})
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              size={20}
              className="animate-spin text-[var(--text-muted)]"
            />
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 border-b border-[var(--studio-border)] px-5 py-3 last:border-b-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--studio-accent)] text-xs font-bold text-[var(--text-on-accent)]">
                {initials(member.userName, member.userEmail)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {member.userName || member.userEmail || "Unknown"}
                  {isMe(member) && (
                    <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">
                      (you)
                    </span>
                  )}
                </p>
                {member.userEmail && (
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {member.userEmail}
                  </p>
                )}
              </div>

              {/* Role selector or badge */}
              {canManage && !isOwner(member) && !isMe(member) ? (
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member, e.target.value as OrgRole)
                  }
                  className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-panel)] px-2.5 py-1">
                  <Shield
                    className={`h-3 w-3 ${ROLE_COLOURS[member.role]}`}
                  />
                  <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                    {ROLE_LABELS[member.role]}
                  </span>
                </div>
              )}

              {/* Remove button */}
              {canManage && !isOwner(member) && !isMe(member) && (
                <button
                  onClick={() => setRemoveTarget(member)}
                  className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-red-400"
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Remove member confirm modal */}
      {removeTarget && (
        <ConfirmModal
          title="Remove member"
          message={`Are you sure you want to remove ${
            removeTarget.userName || removeTarget.userEmail || "this member"
          } from ${activeOrg?.name || "the organisation"}? They will lose access immediately.`}
          confirmLabel="Remove"
          destructive
          loading={removing}
          onConfirm={handleRemove}
          onClose={() => setRemoveTarget(null)}
        />
      )}

      {/* Cancel invitation confirm modal */}
      {cancelTarget && (
        <ConfirmModal
          title="Cancel invitation"
          message={`Cancel the pending invitation to ${cancelTarget.email}? They will no longer be able to join using this link.`}
          confirmLabel="Cancel invitation"
          destructive
          loading={cancelling}
          onConfirm={handleCancelInvite}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
