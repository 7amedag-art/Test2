"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callback = params.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("analyst@elp.local");
  const [password, setPassword] = useState("analyst123");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await signIn("credentials", {
      email, password, redirect: false, callbackUrl: callback,
    });
    setBusy(false);
    if (res?.ok) router.push(callback);
    else setErr("Invalid credentials");
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card p-6 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">تسجيل الدخول / Sign in</h1>
        <label className="block text-sm">
          <span className="text-ink-700">Email</span>
          <input className="mt-1 w-full rounded-lg border border-surface-100 px-3 py-2 outline-none focus:border-brand-500"
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-700">Password</span>
          <input type="password" className="mt-1 w-full rounded-lg border border-surface-100 px-3 py-2 outline-none focus:border-brand-500"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {err ? <div className="text-sm text-rose-600">{err}</div> : null}
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? "…" : "دخول / Enter"}
        </button>
        <p className="text-xs text-ink-500">
          Dev users: admin@elp.local / analyst@elp.local / viewer@elp.local (passwords match role names + 123).
        </p>
      </form>
    </div>
  );
}
