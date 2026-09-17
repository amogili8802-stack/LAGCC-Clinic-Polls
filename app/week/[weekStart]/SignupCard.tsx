"use client";

import { useState } from "react";
import { formatTime } from "@/lib/clinics";

type Signup = {
  id: string;
  kidName: string;
  kidAge: number;
  waitlisted: boolean;
};

type SessionForCard = {
  id: string;
  date: string; // ISO
  capacity: number;
  status: string;
  cancellationReason?: string | null;
  cancellationNote?: string | null;
  template: {
    name: string;
    startTime: string;
    endTime: string;
    ageMin: number;
    ageMax: number;
  };
  signups: Signup[];
};

const REASON_LABELS: Record<string, string> = {
  RAIN: "Rain",
  HEAT: "Extreme heat",
  LOW_SIGNUPS: "Not enough sign-ups",
  OTHER: "Cancelled",
};

type KidRow = { name: string; age: string; memberNumber: string };

export default function SignupCard({ session }: { session: SessionForCard }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [kids, setKids] = useState<KidRow[]>([{ name: "", age: "", memberNumber: "" }]);

  const activeSignups = session.signups.filter((s) => !s.waitlisted);
  const waitlisted = session.signups.filter((s) => s.waitlisted);
  const spotsLeft = Math.max(0, session.capacity - activeSignups.length);
  const isFull = spotsLeft === 0;
  const isCancelled = session.status === "CANCELLED";

  function updateKid(i: number, field: keyof KidRow, value: string) {
    setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, [field]: value } : k)));
  }

  function addKidRow() {
    setKids((prev) => [...prev, { name: "", age: "", memberNumber: "" }]);
  }

  function removeKidRow(i: number) {
    setKids((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanedKids = kids
      .map((k) => ({ name: k.name.trim(), age: parseInt(k.age, 10), memberNumber: k.memberNumber.trim() }))
      .filter((k) => k.name.length > 0);

    if (cleanedKids.length === 0) {
      setError("Add at least one child.");
      return;
    }
    if (cleanedKids.some((k) => Number.isNaN(k.age) || k.age < 0 || k.age > 18)) {
      setError("Enter a valid age for each child.");
      return;
    }
    if (cleanedKids.some((k) => k.memberNumber.length === 0)) {
      setError("Enter a member number for each child.");
      return;
    }
    if (!parentName.trim() || !parentPhone.trim()) {
      setError("Parent name and phone number are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          parentEmail: parentEmail.trim() || undefined,
          kids: cleanedKids,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(
        data.waitlistedCount > 0
          ? `Signed up! ${data.waitlistedCount} of your ${cleanedKids.length} child(ren) were added to the waitlist since this clinic is full.`
          : "You're signed up! A confirmation text is on its way."
      );
      setParentName("");
      setParentPhone("");
      setParentEmail("");
      setKids([{ name: "", age: "", memberNumber: "" }]);
      setTimeout(() => window.location.reload(), 1400);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-court-green focus:outline-none focus:ring-2 focus:ring-court-green/20";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-card transition hover:shadow-cardHover ${
        isCancelled ? "border-red-100 bg-red-50/60" : "border-slate-200/80 bg-white"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${isCancelled ? "bg-red-300" : "bg-court-green"}`}
      />
      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div>
          <h3 className="text-lg font-bold text-court-navy">{session.template.name}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Ages {session.template.ageMin}-{session.template.ageMax} &middot;{" "}
            {formatTime(session.template.startTime)}–{formatTime(session.template.endTime)}
          </p>
        </div>
        {!isCancelled && (
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
              isFull ? "bg-amber-100 text-amber-800" : "bg-court-greenLight text-court-greenDark"
            }`}
          >
            {isFull ? "Full — waitlist open" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
          </span>
        )}
      </div>

      {isCancelled && (
        <div className="mt-3 ml-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
          Cancelled — {REASON_LABELS[session.cancellationReason || "OTHER"]}
          {session.cancellationNote ? `: ${session.cancellationNote}` : ""}
        </div>
      )}

      {activeSignups.length > 0 && (
        <ul className="mt-3 ml-2 flex flex-wrap gap-1.5 text-sm text-slate-700">
          {activeSignups.map((s) => (
            <li key={s.id} className="rounded-full bg-slate-100 px-3 py-1 font-medium">
              {s.kidName} <span className="text-slate-400">({s.kidAge})</span>
            </li>
          ))}
        </ul>
      )}
      {waitlisted.length > 0 && (
        <div className="mt-2 ml-2 text-xs font-medium text-amber-700">
          Waitlist: {waitlisted.map((s) => `${s.kidName} (${s.kidAge})`).join(", ")}
        </div>
      )}

      {!isCancelled && (
        <div className="ml-2 mt-4">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="rounded-full bg-court-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-court-greenDark hover:shadow"
            >
              {isFull ? "Join Waitlist" : "Sign Up"}
            </button>
          ) : (
            <form onSubmit={submit} className="mt-2 space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Parent/guardian name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className={`w-full ${inputClass}`}
                  required
                />
                <input
                  type="tel"
                  placeholder="Cell phone (for text updates)"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className={`w-full ${inputClass}`}
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email (optional)"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className={`w-full ${inputClass}`}
              />

              <div className="space-y-2 border-t border-slate-200/80 pt-3">
                {kids.map((kid, i) => (
                  <div key={i} className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Child's name"
                        value={kid.name}
                        onChange={(e) => updateKid(i, "name", e.target.value)}
                        className={`flex-1 ${inputClass}`}
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        min={0}
                        max={18}
                        value={kid.age}
                        onChange={(e) => updateKid(i, "age", e.target.value)}
                        className={`w-20 ${inputClass}`}
                      />
                      {kids.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeKidRow(i)}
                          className="px-2 text-sm text-slate-400 transition hover:text-red-600"
                          aria-label="Remove child"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Member #"
                      value={kid.memberNumber}
                      onChange={(e) => updateKid(i, "memberNumber", e.target.value)}
                      className={`w-full ${inputClass}`}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addKidRow}
                  className="text-sm font-semibold text-court-green hover:text-court-greenDark hover:underline"
                >
                  + Add another child
                </button>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              {success && <p className="text-sm font-medium text-court-greenDark">{success}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-court-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-court-greenDark disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Confirm Sign Up"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
