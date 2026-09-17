"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { formatTime } from "@/lib/clinics";
import { formatDateLong } from "@/lib/date";

type Signup = {
  id: string;
  kidName: string;
  kidAge: number;
  memberNumber: string | null;
  recurringSignupId: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  waitlisted: boolean;
  addedByCoach: boolean;
  createdAt: string;
};

type Session = {
  id: string;
  date: string;
  capacity: number;
  minSignups: number;
  status: string;
  cancellationReason?: string | null;
  cancellationNote?: string | null;
  cancelledBy?: string | null;
  template: { name: string; startTime: string; endTime: string; ageMin: number; ageMax: number };
  signups: Signup[];
};

const REASONS: { value: string; label: string }[] = [
  { value: "RAIN", label: "Rain" },
  { value: "HEAT", label: "Extreme heat" },
  { value: "LOW_SIGNUPS", label: "Not enough sign-ups" },
  { value: "OTHER", label: "Other" },
];

const inputClass =
  "w-full rounded-lg border border-court-navy/15 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15";

export default function DashboardClient({
  coachName,
  weekLabel,
  prevWeekHref,
  nextWeekHref,
  sessions,
}: {
  coachName: string;
  weekLabel: string;
  prevWeekHref: string;
  nextWeekHref: string;
  sessions: Session[];
}) {
  const byDate = new Map<string, Session[]>();
  for (const s of sessions) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-court-navy/10 bg-white p-5 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-court-gold">Coach Dashboard</p>
          <h1 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-court-navy">
            Week of {weekLabel}
          </h1>
          <p className="mt-0.5 text-sm text-court-navy/50">Signed in as {coachName}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-court-navy/15 px-4 py-1.5 text-sm font-medium text-court-navy/70 transition hover:border-court-navy/30 hover:bg-court-navy/5"
        >
          Sign out
        </button>
      </div>

      <div className="mb-6 flex justify-between">
        <Link
          href={prevWeekHref}
          className="flex items-center gap-1 rounded-full border border-court-navy/15 bg-white px-3 py-1.5 text-sm font-medium text-court-navy shadow-sm transition hover:border-court-navy/30"
        >
          ← Previous week
        </Link>
        <Link
          href={nextWeekHref}
          className="flex items-center gap-1 rounded-full border border-court-navy/15 bg-white px-3 py-1.5 text-sm font-medium text-court-navy shadow-sm transition hover:border-court-navy/30"
        >
          Next week →
        </Link>
      </div>

      <div className="space-y-8">
        {Array.from(byDate.entries()).map(([dateIso, daySessions]) => (
          <section key={dateIso}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-base font-semibold text-court-navy/70">
                {formatDateLong(new Date(dateIso))}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-court-navy/15 to-transparent" />
            </div>
            <div className="space-y-4">
              {daySessions.map((session) => (
                <SessionPanel key={session.id} session={session} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SessionPanel({ session }: { session: Session }) {
  const [busy, setBusy] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("RAIN");
  const [note, setNote] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [capacity, setCapacity] = useState(session.capacity);
  const [minSignups, setMinSignups] = useState(session.minSignups);

  const activeSignups = session.signups.filter((s) => !s.waitlisted);
  const waitlisted = session.signups.filter((s) => s.waitlisted);
  const isCancelled = session.status === "CANCELLED";
  const belowMinimum = !isCancelled && activeSignups.length < session.minSignups;

  async function refresh() {
    window.location.reload();
  }

  async function removeSignup(id: string) {
    if (!confirm("Remove this child from the roster?")) return;
    setBusy(true);
    try {
      await fetch(`/api/coach/signup/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function cancelSession(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/coach/session/${session.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Clinic cancelled. ${data.textsSent} text message(s) sent.`);
        await refresh();
      } else {
        alert(data.error || "Failed to cancel.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function reopenSession() {
    if (!confirm("Reopen this clinic (undo cancellation)?")) return;
    setBusy(true);
    try {
      await fetch(`/api/coach/session/${session.id}/reopen`, { method: "POST" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveLimits() {
    setBusy(true);
    try {
      const res = await fetch(`/api/coach/session/${session.id}/capacity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity, minSignups }),
      });
      if (res.ok) {
        await refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-card ${
        isCancelled ? "border-red-100 bg-red-50/60" : "border-court-navy/10 bg-white"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${isCancelled ? "bg-red-300" : "bg-court-navy"}`} />
      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-court-navy">{session.template.name}</h3>
          <p className="mt-0.5 text-sm text-court-navy/50">
            Ages {session.template.ageMin}-{session.template.ageMax} &middot;{" "}
            {formatTime(session.template.startTime)}–{formatTime(session.template.endTime)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
              belowMinimum ? "bg-court-goldLight text-court-gold" : "bg-court-navy/[0.06] text-court-navy/70"
            }`}
          >
            {activeSignups.length}/{session.capacity} signed up
            {waitlisted.length > 0 && ` · +${waitlisted.length} waitlist`}
            {belowMinimum && ` · below min (${session.minSignups})`}
          </span>
          <a
            href={`/api/coach/session/${session.id}/roster`}
            className="rounded-full border border-court-navy/15 px-3 py-1 text-xs font-medium text-court-navy/70 transition hover:border-court-navy/30 hover:bg-court-navy/5"
          >
            Export CSV
          </a>
          {isCancelled ? (
            <button
              onClick={reopenSession}
              disabled={busy}
              className="rounded-full bg-court-green px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-court-greenDark"
            >
              Reopen
            </button>
          ) : (
            <button
              onClick={() => setShowCancel((v) => !v)}
              className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Cancel Clinic
            </button>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className="mt-3 ml-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
          Cancelled by {session.cancelledBy || "a coach"} —{" "}
          {REASONS.find((r) => r.value === session.cancellationReason)?.label || "Other"}
          {session.cancellationNote ? `: ${session.cancellationNote}` : ""}
        </div>
      )}

      {showCancel && !isCancelled && (
        <form onSubmit={cancelSession} className="ml-2 mt-3 space-y-2 rounded-xl border border-red-100 bg-red-50/80 p-4">
          <p className="text-sm font-medium text-red-900">
            This will text everyone signed up (including the waitlist) that this clinic is cancelled.
          </p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Optional note (e.g. 'Will reschedule Saturday')"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
            >
              Confirm Cancellation
            </button>
            <button
              type="button"
              onClick={() => setShowCancel(false)}
              className="rounded-full px-4 py-2 text-sm text-court-navy/50 transition hover:bg-court-navy/5"
            >
              Never mind
            </button>
          </div>
        </form>
      )}

      <div className="ml-2 mt-4 flex flex-wrap items-center gap-3 text-xs text-court-navy/60">
        <span className="flex items-center gap-1.5">
          <label className="font-medium">Min to run:</label>
          <input
            type="number"
            min={0}
            max={100}
            value={minSignups}
            onChange={(e) => setMinSignups(parseInt(e.target.value, 10) || 0)}
            className="w-14 rounded-lg border border-court-navy/15 px-2 py-1 shadow-sm focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15"
          />
        </span>
        <span className="flex items-center gap-1.5">
          <label className="font-medium">Max capacity:</label>
          <input
            type="number"
            min={1}
            max={100}
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
            className="w-14 rounded-lg border border-court-navy/15 px-2 py-1 shadow-sm focus:border-court-navy focus:outline-none focus:ring-2 focus:ring-court-navy/15"
          />
        </span>
        <button
          onClick={saveLimits}
          disabled={busy || (capacity === session.capacity && minSignups === session.minSignups)}
          className="font-semibold text-court-navy hover:underline disabled:opacity-40"
        >
          Save
        </button>
      </div>
      {!isCancelled && (
        <p className="ml-2 mt-1 text-xs text-court-navy/35">
          Auto-cancels at 8pm the day before if under {session.minSignups} sign-ups.
        </p>
      )}

      {session.signups.length > 0 && (
        <div className="ml-2 mt-4 overflow-hidden rounded-xl border border-court-navy/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-court-navy/[0.03] text-xs uppercase tracking-wide text-court-navy/40">
                <th className="px-3 py-2 font-semibold">Child</th>
                <th className="px-3 py-2 font-semibold">Member #</th>
                <th className="px-3 py-2 font-semibold">Parent</th>
                <th className="px-3 py-2 font-semibold">Phone</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {[...activeSignups, ...waitlisted].map((s) => (
                <tr key={s.id} className="border-t border-court-navy/10">
                  <td className="px-3 py-2">
                    <span className="font-medium text-court-navy/80">{s.kidName}</span>{" "}
                    <span className="text-court-navy/40">({s.kidAge})</span>
                    {s.waitlisted && <span className="ml-1.5 font-medium text-court-gold">waitlist</span>}
                    {s.recurringSignupId && <span className="ml-1.5 text-court-navy/40">· 🔁 weekly</span>}
                    {s.addedByCoach && <span className="ml-1.5 text-court-navy/40">· added by coach</span>}
                  </td>
                  <td className="px-3 py-2 text-court-navy/60">{s.memberNumber || "—"}</td>
                  <td className="px-3 py-2 text-court-navy/60">{s.parentName}</td>
                  <td className="px-3 py-2 text-court-navy/60">{s.parentPhone}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => removeSignup(s.id)}
                      disabled={busy}
                      className="font-semibold text-red-600 hover:underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ml-2 mt-4">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm font-semibold text-court-green hover:text-court-greenDark hover:underline"
          >
            + Add walk-in / phone sign-up
          </button>
        ) : (
          <AddWalkInForm sessionId={session.id} onDone={() => refresh()} onClose={() => setShowAdd(false)} />
        )}
      </div>
    </div>
  );
}

function AddWalkInForm({
  sessionId,
  onDone,
  onClose,
}: {
  sessionId: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [kidName, setKidName] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [kidAge, setKidAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const age = parseInt(kidAge, 10);
    if (!kidName.trim() || !parentName.trim() || !parentPhone.trim() || Number.isNaN(age)) {
      setError("Fill in child name, age, parent name and phone.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/coach/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          kidName,
          memberNumber: memberNumber.trim() || undefined,
          kidAge: age,
          parentName,
          parentPhone,
          recurring,
        }),
      });
      if (res.ok) {
        onDone();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 grid gap-2.5 rounded-xl border border-court-navy/10 bg-court-cream/50 p-4 sm:grid-cols-2">
      <input placeholder="Child name" value={kidName} onChange={(e) => setKidName(e.target.value)} className={inputClass} />
      <input placeholder="Member # (optional)" value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} className={inputClass} />
      <input placeholder="Age" type="number" value={kidAge} onChange={(e) => setKidAge(e.target.value)} className={inputClass} />
      <input placeholder="Parent name" value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputClass} />
      <input placeholder="Parent phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className={inputClass} />
      <label className="col-span-2 flex items-center gap-2 text-xs font-medium text-court-navy/70">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-court-navy/30 text-court-green focus:ring-court-green/30"
        />
        🔁 Sign up automatically every week until cancelled
      </label>
      {error && <p className="col-span-2 text-sm font-medium text-red-600">{error}</p>}
      <div className="col-span-2 flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-court-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-court-greenDark disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-court-navy/50 transition hover:bg-court-navy/5">
          Cancel
        </button>
      </div>
    </form>
  );
}
