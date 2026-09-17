"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ParentRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/parent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email || undefined, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      const signInRes = await signIn("parent", { phone, password, redirect: false });
      if (signInRes?.error) {
        setError("Account created — please log in.");
        router.push("/parent/login");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-court-navy/15 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15";

  return (
    <div className="mx-auto mt-4 max-w-sm">
      <div className="mb-6 text-center">
        <span className="font-script text-4xl leading-none text-court-navy">Create Account</span>
        <p className="mt-2 font-display text-sm italic text-court-navy/50">
          One account for the whole family
        </p>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-court-navy/10 bg-white p-6 shadow-card">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password (8+ characters)"
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
          {loading ? "Creating account…" : "Create Account"}
        </button>
        <p className="text-center text-sm text-court-navy/50">
          Already have an account?{" "}
          <Link href="/parent/login" className="font-semibold text-court-green hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
