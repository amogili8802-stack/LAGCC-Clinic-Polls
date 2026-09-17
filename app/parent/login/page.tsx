"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ParentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("parent", { phone, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect phone number or password.");
      return;
    }
    router.push(searchParams.get("next") || "/");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-court-navy/15 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15";

  return (
    <div className="mx-auto mt-4 max-w-sm">
      <div className="mb-6 text-center">
        <span className="font-script text-4xl leading-none text-court-navy">Log In</span>
        <p className="mt-2 font-display text-sm italic text-court-navy/50">
          Sign up your kids and manage your clinics
        </p>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-court-navy/10 bg-white p-6 shadow-card">
        <input
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
          className="w-full rounded-full bg-court-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-court-greenDark disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log In"}
        </button>
        <p className="text-center text-sm text-court-navy/50">
          New here?{" "}
          <Link href="/parent/register" className="font-semibold text-court-green hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
