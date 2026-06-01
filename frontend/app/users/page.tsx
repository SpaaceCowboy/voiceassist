"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsersIcon } from "@/components/ui/icons";
import { registerUser, changeMyPassword, type Role } from "@/lib/api/usersApi";
import { useAuthStore } from "@/store/auth";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function UsersPage() {
  const me = useAuthStore((s) => s.user);

  // Create user form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [password, setPassword] = useState("");
  const [busyCreate, setBusyCreate] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);

  // Change my password form
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busyPw, setBusyPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const canSubmitCreate = useMemo(() => {
    return fullName.trim().length >= 2 && isEmail(email) && password.length >= 6;
  }, [fullName, email, password]);

  async function onCreate() {
    setCreateMsg(null);
    setCreateErr(null);
    setBusyCreate(true);

    const res = await registerUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    });

    setBusyCreate(false);

    if (!res.success) {
      setCreateErr(res.error ?? "Failed to create user");
      return;
    }

    setCreateMsg(res.message ?? "User created.");
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("user");
  }

  async function onChangePassword() {
    setPwMsg(null);
    setPwErr(null);
    setBusyPw(true);

    if (oldPw.length < 1 || newPw.length < 6) {
      setBusyPw(false);
      setPwErr("New password must be at least 6 characters.");
      return;
    }

    const res = await changeMyPassword({ password: oldPw, newPassword: newPw });
    setBusyPw(false);

    if (!res.success) {
      setPwErr(res.error ?? "Failed to change password");
      return;
    }

    setPwMsg(res.message ?? "Password updated.");
    setOldPw("");
    setNewPw("");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        icon={<UsersIcon />}
        title="Users"
        subtitle="Create members (moderator/user) and manage your own password."
        badge={
          me?.email ? (
            <span
              className="rounded-full border px-2.5 py-1 text-xs"
              style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
            >
              {me.email} · {me?.role ?? "—"}
            </span>
          ) : null
        }
      />

      {/* Member directory — listing/management lives in the backend, which is out of scope here */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">Member directory</div>
            <div className="mt-0.5 text-sm" style={{ color: "rgb(var(--muted))" }}>
              Listing members, editing roles, deactivating accounts and resetting other users&apos;
              passwords require backend endpoints that aren&apos;t available to the dashboard yet.
            </div>
          </div>
          <span
            className="shrink-0 rounded-full border px-2.5 py-1 text-xs"
            style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
          >
            Backend needed
          </span>
        </div>
        <div
          className="mt-4 rounded-xl border border-dashed px-4 py-8 text-center text-sm"
          style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
        >
          A member list will appear here once a users API is exposed by the backend.
        </div>
      </Card>

      {/* Create User */}
      <Card>
        <CardHeader
          title="Create member"
          subtitle="Uses POST /auth/register (moderator only)."
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Full name</div>
              <Input value={fullName} onChange={setFullName} placeholder="e.g., Front Desk" />
            </div>

            <div className="space-y-1">
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Email</div>
              <Input value={email} onChange={setEmail} placeholder="user@example.com" />
            </div>

            <div className="space-y-1">
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Role</div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="px-3 py-2 rounded-xl border text-sm w-full"
                style={{
                  background: "rgb(var(--surface2))",
                  borderColor: "rgb(var(--border))",
                  color: "rgb(var(--text))",
                }}
              >
                <option value="user">user</option>
                <option value="moderator">moderator</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Temp password</div>
              <Input value={password} onChange={setPassword} placeholder="min 6 chars" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button variant="primary" onClick={onCreate} disabled={!canSubmitCreate || busyCreate}>
              {busyCreate ? "Creating…" : "Create user"}
            </Button>
            {createMsg ? <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>{createMsg}</div> : null}
          </div>

          {createErr ? (
            <div className="mt-2 text-sm" style={{ color: "rgb(239,68,68)" }}>
              {createErr}
            </div>
          ) : null}

          <div className="mt-3 text-xs" style={{ color: "rgb(var(--muted))" }}>
            Note: listing users requires a GET endpoint (we’ll add later). For now this page creates members.
          </div>
        </CardBody>
      </Card>

      {/* Change My Password */}
      <Card>
        <CardHeader
          title="Change my password"
          subtitle="Uses PATCH /auth/password (changes current logged-in user)."
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Current password</div>
              <Input value={oldPw} onChange={setOldPw} placeholder="current password" />
            </div>

            <div className="space-y-1">
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>New password</div>
              <Input value={newPw} onChange={setNewPw} placeholder="min 6 chars" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button variant="primary" onClick={onChangePassword} disabled={busyPw || newPw.length < 6 || oldPw.length < 1}>
              {busyPw ? "Updating…" : "Update password"}
            </Button>
            {pwMsg ? <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>{pwMsg}</div> : null}
          </div>

          {pwErr ? (
            <div className="mt-2 text-sm" style={{ color: "rgb(239,68,68)" }}>
              {pwErr}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
