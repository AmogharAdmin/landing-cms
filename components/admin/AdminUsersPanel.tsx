"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { KeyRound, LoaderCircle, Plus, ShieldCheck, Trash2, UserRound, X } from "lucide-react";

type AdminUser = {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
};

type EditorState = { id?: number; email: string; password: string };

const emptyEditor: EditorState = { email: "", password: "" };

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setNeedsAuth(false);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store", credentials: "same-origin" });
      const result = await response.json() as { ok?: boolean; users?: AdminUser[]; currentAdminId?: number; error?: string };
      if (response.status === 401) {
        setNeedsAuth(true);
        setUsers([]);
        return;
      }
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load administrators.");
      setUsers(result.users || []);
      setCurrentAdminId(result.currentAdminId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load administrators.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    setMessage("");
    setEditorError("");
    try {
      const response = await fetch("/api/admin/users", {
        method: editor.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(editor.id
          ? { id: editor.id, email: editor.email, ...(editor.password ? { password: editor.password } : {}) }
          : editor),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save administrator.");
      setEditor(null);
      setEditorError("");
      setMessage(editor.id ? "Administrator updated successfully." : "New administrator created successfully.");
      await loadUsers();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Unable to save administrator.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(user: AdminUser) {
    setMessage("");
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id: user.id, isActive: !user.is_active }),
    });
    const result = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) setMessage(result.error || "Unable to change account status.");
    else await loadUsers();
  }

  async function removeUser(user: AdminUser) {
    if (!window.confirm(`Delete ${user.email}? This action cannot be undone.`)) return;
    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id: user.id }),
    });
    const result = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) setMessage(result.error || "Unable to delete administrator.");
    else {
      setMessage("Administrator deleted.");
      await loadUsers();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-[#0b1f35] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-5 text-[#d3a45f]" /> Users</div>
          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-300">Add team logins, reset passwords, or suspend access. New users sign in at /admin.</p>
        </div>
        <button type="button" onClick={() => { setEditor(emptyEditor); setEditorError(""); }} disabled={needsAuth} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#b98945] px-4 text-xs font-medium text-white hover:bg-[#a57738] disabled:opacity-50">
          <Plus className="size-4" /> Add user
        </button>
      </div>

      {needsAuth ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-950">
          <p className="font-medium">Sign in to the production admin to add users.</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">User accounts are stored in the database. Open the signed-in admin, then use Add user.</p>
          <a href="/admin" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#0b1f35] px-4 text-xs font-medium text-white hover:bg-[#173b60]">Go to /admin and sign in</a>
        </div>
      ) : null}

      {message ? <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">{message}</div> : null}

      {loading ? (
        <div className="flex min-h-52 items-center justify-center text-slate-500"><LoaderCircle className="mr-2 size-5 animate-spin" /> Loading team access…</div>
      ) : needsAuth ? null : (
        <div className="grid gap-3">
          {users.map((user) => {
            const isCurrent = user.id === currentAdminId;
            return (
              <article key={user.id} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0b1f35]"><UserRound className="size-5" /></span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-[#0b1f35]">{user.email}</p>
                      {isCurrent ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">YOU</span> : null}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{user.is_active ? "ACTIVE" : "SUSPENDED"}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Last login: {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Not yet"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setEditor({ id: user.id, email: user.email, password: "" }); setEditorError(""); }} className="admin-tool-button"><KeyRound className="size-4" /> Edit / reset password</button>
                  <button type="button" disabled={isCurrent} onClick={() => updateStatus(user)} className="admin-tool-button disabled:cursor-not-allowed disabled:opacity-40">{user.is_active ? "Suspend" : "Activate"}</button>
                  <button type="button" disabled={isCurrent} onClick={() => removeUser(user)} className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Delete ${user.email}`}><Trash2 className="size-4" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editor ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#07111e]/65 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setEditor(null)}>
          <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#b98945]">Team access</p>
                <h2 className="mt-1 text-xl font-medium text-[#0b1f35]">{editor.id ? "Edit user" : "Add user"}</h2>
              </div>
              <button type="button" onClick={() => setEditor(null)} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Close"><X className="size-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="admin-label">Email address</span><input type="email" required value={editor.email} onChange={(event) => setEditor({ ...editor, email: event.target.value })} className="admin-input" placeholder="admin@example.com" /></label>
              <label className="block"><span className="admin-label">{editor.id ? "New password (leave blank to keep current)" : "Temporary password"}</span><input type="password" required={!editor.id} minLength={6} value={editor.password} onChange={(event) => setEditor({ ...editor, password: event.target.value })} className="admin-input" autoComplete="new-password" /></label>
              <p className="rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">Use at least 6 characters.</p>
              {editorError ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] leading-5 text-red-800">{editorError}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditor(null)} className="admin-tool-button">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0b1f35] px-5 text-xs font-medium text-white disabled:opacity-50">{saving ? <LoaderCircle className="size-4 animate-spin" /> : null}{editor.id ? "Save account" : "Create account"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
