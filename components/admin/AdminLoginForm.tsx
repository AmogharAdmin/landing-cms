"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to sign in.");
      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b98945]">Secure administration</p>
      <h1 className="mt-2 text-3xl font-bold text-[#0b1f35]">Content Studio</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the administrator account created on the server.</p>

      <label className="mt-7 block">
        <span className="text-xs font-semibold text-slate-700">Email address</span>
        <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 focus-within:border-[#b98945]">
          <Mail className="size-4 text-slate-400" />
          <input name="email" type="email" autoComplete="username" required className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </span>
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-semibold text-slate-700">Password</span>
        <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 focus-within:border-[#b98945]">
          <LockKeyhole className="size-4 text-slate-400" />
          <input name="password" type="password" autoComplete="current-password" required className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </span>
      </label>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <button type="submit" disabled={pending} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f35] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#173b60] disabled:opacity-60">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
