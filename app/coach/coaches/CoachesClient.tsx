"use client";

import { useState } from "react";
import Link from "next/link";

type Coach = { id: string; name: string; email: string; phone: string | null; createdAt: string };

const inputClass =
  "w-full rounded-lg border border-court-navy/15 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15";

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}

export default function CoachesClient({
  coaches: initialCoaches,
  currentCoachEmail,
}: {
  coaches: Coach[];
  currentCoachEmail: string;
}) {
  const [coaches, setCoaches] = useState(initialCoaches);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [phoneDrafts, setPhoneDrafts] = useState<Record<string, string>>({});

  function draftFor(c: Coach) {
    return phoneDrafts[c.id] ?? formatPhoneDisplay(c.phone);
  }

  async function addCoach(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/coach/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add coach.");
        return;
      }
      setCoaches((prev) => [...prev, data.coach]);
      setSuccess(`${data.coach.name} can now log in at /coach/login with the email and password you set.`);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function savePhone(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/coach/coaches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneDrafts[id] || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save phone number.");
        return;
      }
      setCoaches((prev) => prev.map((c) => (c.id === id ? data.coach : c)));
      setPhoneDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setBusyId(null);
    }
  }

  async function removeCoach(id: string, coachName: string) {
    if (!confirm(`Remove ${coachName}'s coach access? They won't be able to log in anymore.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/coach/coaches/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to remove coach.");
        return;
      }
      setCoaches((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-court-navy/10 bg-white p-5 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-court-gold">Coach Dashboard</p>
          <h1 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-court-navy">Coaches</h1>
          <p className="mt-0.5 text-sm text-court-navy/50">
            Only people added here can log in and manage rosters — there's no public coach sign-up. A coach's
            phone number is optional, but without one they won't get a text when a clinic is cancelled.
          </p>
        </div>
        <Link
          href="/coach/dashboard"
          className="rounded-full border border-court-navy/15 px-4 py-1.5 text-sm font-medium text-court-navy/70 transition hover:border-court-navy/30 hover:bg-court-navy/5"
        >
          Back to Dashboard
        </Link>
      </div>

      {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mb-6 overflow-hidden rounded-2xl border border-court-navy/10 shadow-card">
        <table className="hidden w-full text-left text-sm sm:table">
          <thead>
            <tr className="bg-court-navy/[0.03] text-xs uppercase tracking-wide text-court-navy/40">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone (cancellation texts)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((c) => (
              <tr key={c.id} className="border-t border-court-navy/10">
                <td className="px-4 py-3 font-medium text-court-navy/80">
                  {c.name}
                  {c.email === currentCoachEmail && (
                    <span className="ml-1.5 text-xs font-normal text-court-navy/40">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-court-navy/60">{c.email}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="tel"
                      placeholder="Add phone number"
                      value={draftFor(c)}
                      onChange={(e) => setPhoneDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-40 rounded-lg border border-court-navy/15 px-2.5 py-1.5 text-sm shadow-sm focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15"
                    />
                    {phoneDrafts[c.id] !== undefined && phoneDrafts[c.id] !== formatPhoneDisplay(c.phone) && (
                      <button
                        onClick={() => savePhone(c.id)}
                        disabled={busyId === c.id}
                        className="shrink-0 text-xs font-semibold text-court-green hover:underline disabled:opacity-40"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => removeCoach(c.id, c.name)}
                    disabled={busyId === c.id || coaches.length <= 1}
                    className="font-semibold text-red-600 hover:underline disabled:opacity-40"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divide-y divide-court-navy/10 sm:hidden">
          {coaches.map((c) => (
            <div key={c.id} className="bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-court-navy/80">
                  {c.name}
                  {c.email === currentCoachEmail && (
                    <span className="ml-1.5 text-xs font-normal text-court-navy/40">(you)</span>
                  )}
                </p>
                <button
                  onClick={() => removeCoach(c.id, c.name)}
                  disabled={busyId === c.id || coaches.length <= 1}
                  className="shrink-0 font-semibold text-red-600 hover:underline disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <p className="text-court-navy/60">{c.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <input
                  type="tel"
                  placeholder="Add phone number"
                  value={draftFor(c)}
                  onChange={(e) => setPhoneDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  className="w-full rounded-lg border border-court-navy/15 px-2.5 py-1.5 text-sm shadow-sm focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15"
                />
                {phoneDrafts[c.id] !== undefined && phoneDrafts[c.id] !== formatPhoneDisplay(c.phone) && (
                  <button
                    onClick={() => savePhone(c.id)}
                    disabled={busyId === c.id}
                    className="shrink-0 text-xs font-semibold text-court-green hover:underline disabled:opacity-40"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-court-navy/10 bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-semibold text-court-navy">Add a coach</h2>
        <p className="mt-0.5 text-sm text-court-navy/50">
          Set a password here and share it with them directly — it isn't emailed or texted.
        </p>
        <form onSubmit={addCoach} className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Phone (optional, for cancellation texts)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm font-medium text-red-600 sm:col-span-2">{error}</p>}
          {success && <p className="text-sm font-medium text-court-greenDark sm:col-span-2">{success}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-court-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-court-greenDark disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add Coach"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
