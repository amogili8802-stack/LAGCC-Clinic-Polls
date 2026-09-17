"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CoachLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/coach/dashboard");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15";

  return (
    <div className="mx-auto mt-4 max-w-sm">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-navy text-2xl shadow-sm">
          🎾
        </span>
        <h1 className="mt-3 text-xl font-extrabold tracking-tight text-court-navy">Coach Login</h1>
        <p className="mt-1 text-sm text-slate-500">Manage rosters and clinic cancellations</p>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
        />
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-court-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-court-navyLight disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
