"use client";

import { useState } from "react";

type MySignup = {
  id: string;
  kidName: string;
  kidAge: number;
  waitlisted: boolean;
  sessionLabel: string;
  sessionDate: string;
  cancelled: boolean;
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
        body: JSON.stringify({ signupId: id, parentPhone: phone.trim() }),
      });
      if (res.ok) {
        setResults((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-medium text-court-navy hover:underline"
      >
        {open ? "Hide" : "Manage my sign-ups"} (cancel or view by phone number)
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <form onSubmit={lookup} className="flex gap-2">
            <input
              type="tel"
              placeholder="Phone number used at sign-up"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-court-navy px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Looking…" : "Find"}
            </button>
          </form>
          {error && <p className="text-red-600">{error}</p>}
          {results && results.length === 0 && (
            <p className="text-slate-500">No upcoming sign-ups found for that number.</p>
          )}
          {results && results.length > 0 && (
            <ul className="space-y-2">
              {results.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
                >
                  <span>
                    <strong>{s.kidName}</strong> ({s.kidAge}) — {s.sessionLabel} on {s.sessionDate}
                    {s.waitlisted && <em className="ml-1 text-amber-700">(waitlist)</em>}
                    {s.cancelled && <em className="ml-1 text-red-700">(clinic cancelled)</em>}
                  </span>
                  <button
                    onClick={() => removeSignup(s.id)}
                    disabled={removingId === s.id}
                    className="text-red-600 hover:underline disabled:opacity-60"
                  >
                    {removingId === s.id ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
