"use client";

import { useState } from "react";

type MySignup = {
  id: string;
  kidName: string;
  waitlisted: boolean;
  cancelled: boolean;
  lateCancellation: boolean;
  sessionLabel: string;
  sessionDate: string;
};

export default function LookupPanel() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MySignup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/signup/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't look that up.");
        setResults(null);
        return;
      }
      setResults(data.signups);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function removeSignup(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch("/api/signup/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupId: id, phone: phone.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lateCancellation) {
          setResults((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, lateCancellation: true } : s)) : prev));
        } else {
          setResults((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
        }
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mb-7 overflow-hidden rounded-2xl border border-court-navy/10 bg-white shadow-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-sm font-semibold text-court-navy transition hover:bg-court-navy/[0.03]"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-court-gold">✦</span> Manage my sign-ups
          <span className="hidden font-normal text-court-navy/40 sm:inline">— cancel or view by phone number</span>
        </span>
        <span className={`text-court-navy/40 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-court-navy/10 bg-court-cream/50 p-4 text-sm">
          <form onSubmit={lookup} className="flex gap-2">
            <input
              type="tel"
              placeholder="Phone number used at sign-up"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 rounded-lg border border-court-navy/15 bg-white px-3.5 py-2.5 shadow-sm transition focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-court-navy px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-court-navyLight disabled:opacity-60"
            >
              {loading ? "Looking…" : "Find"}
            </button>
          </form>
          {error && <p className="font-medium text-red-600">{error}</p>}

          {results && results.length === 0 && (
            <p className="text-court-navy/50">No upcoming sign-ups found for that number.</p>
          )}
          {results && results.length > 0 && (
            <ul className="space-y-2">
              {results.map((s) =>
                s.lateCancellation ? (
                  <li
                    key={s.id}
                    className="rounded-lg border border-red-100 bg-red-50/60 px-3.5 py-2.5 text-red-800 shadow-sm"
                  >
                    <span className="font-medium text-red-700">{s.kidName} — cancelled less than 24 hours</span> —{" "}
                    {s.sessionLabel} on {s.sessionDate}
                    <p className="mt-0.5 text-xs text-red-700/70">Still billed per club policy.</p>
                  </li>
                ) : (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-court-navy/10 bg-white px-3.5 py-2.5 shadow-sm"
                  >
                    <span>
                      <strong className="text-court-navy">{s.kidName}</strong> — {s.sessionLabel} on {s.sessionDate}
                      {s.waitlisted && <em className="ml-1 font-medium text-court-gold">(waitlist)</em>}
                      {s.cancelled && <em className="ml-1 font-medium text-red-700">(clinic cancelled)</em>}
                    </span>
                    <button
                      onClick={() => removeSignup(s.id)}
                      disabled={removingId === s.id}
                      className="shrink-0 font-semibold text-red-600 hover:underline disabled:opacity-60"
                    >
                      {removingId === s.id ? "Removing…" : "Remove"}
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
