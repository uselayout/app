"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { User, Mail, Lock, Loader2, Check } from "lucide-react";
import { InviteCodesPanel } from "@/components/settings/InviteCodesPanel";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Sync name from session when it loads
  useState(() => {
    if (user?.name && !name) setName(user.name);
  });

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/auth/update-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { message?: string }).message || "Failed to update name");
    }

    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordChanged(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setChangingPassword(true);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (res.ok) {
      setPasswordChanged(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordChanged(false), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setPasswordError(
        (data as { message?: string }).message || "Failed to change password"
      );
    }

    setChangingPassword(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-3">
        <User className="h-5 w-5 text-[var(--studio-accent)]" />
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Profile
        </h1>
      </div>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Manage your account details
      </p>

      {/* Email (read-only) */}
      <div className="mt-8 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Email
          </p>
        </div>
        <p className="mt-2 text-sm text-[var(--text-primary)]">
          {user?.email || "—"}
        </p>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
          Email cannot be changed. Contact support if you need to update it.
        </p>
      </div>

      {/* Name */}
      <form
        onSubmit={handleSaveName}
        className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5"
      >
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Display name
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
          />
          <button
            type="submit"
            disabled={saving || !name.trim() || name === user?.name}
            className="flex items-center gap-1.5 rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <Check size={14} />
            ) : null}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </form>

      {/* Change password */}
      <form
        onSubmit={handleChangePassword}
        className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5"
      >
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Change password
          </p>
        </div>
        <div className="mt-3 space-y-2">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            required
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 characters)"
            required
            minLength={8}
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
          />
        </div>
        <button
          type="submit"
          disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="mt-3 flex items-center gap-1.5 rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {changingPassword ? (
            <Loader2 size={14} className="animate-spin" />
          ) : passwordChanged ? (
            <Check size={14} />
          ) : null}
          {passwordChanged ? "Changed" : "Change password"}
        </button>
        {passwordError && (
          <p className="mt-2 text-xs text-red-400">{passwordError}</p>
        )}
        {passwordChanged && (
          <p className="mt-2 text-xs text-emerald-400">
            Password changed successfully
          </p>
        )}
      </form>

      {/* Invite Codes */}
      <div className="mt-8">
        <InviteCodesPanel />
      </div>
    </div>
  );
}
