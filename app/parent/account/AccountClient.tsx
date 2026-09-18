"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type Upcoming = {
  id: string;
  kidName: string;
  kidAge: number;
  waitlisted: boolean;
  cancelled: boolean;
  lateCancellation: boolean;
  sessionLabel: string;
  sessionDate: string;
  recurring: boolean;
};

type Recurring = {
  id: string;
  kidName: string;
  kidAge: number;
  clinicLabel: string;
};

type HistoryEntry = {
  id: string;
  kidName: string;
  kidAge: number;
  sessionLabel: string;
  sessionDate: string;
  lateCancellation: boolean;
};

export default function AccountClient({
  parentName,
  parentPhone,
  upcoming,
  recurring,
  history,
}: {
  parentName: string;
  parentPhone: string;
  upcoming: Upcoming[];
  recurring: Recurring[];
  history: HistoryEntry[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    window.location.reload();
  }

  async function cancelSignup(id: string) {
    if (!confirm("Cancel this sign-up? Cancelling less than 24 hours before the clinic still incurs a charge.")) return;
    setBusyId(id);
    try {
      await fetch("/api/signup/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupId: id }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function stopRecurring(id: string) {
    if (!confirm("Stop this weekly sign-up? Future weeks will no longer auto-enroll this child.")) return;
    setBusyId(id);
    try {
      await fetch("/api/signup/recurring/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurringId: id }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-court-navy/10 bg-white p-5 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-court-gold">My Account</p>
          <h1 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-court-navy">{parentName}</h1>
          <p className="mt-0.5 text-sm text-court-navy/50">{parentPhone}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-court-navy/15 px-4 py-1.5 text-sm font-medium text-court-navy/70 transition hover:border-court-navy/30 hover:bg-court-navy/5"
        >
          Log out
        </button>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-base font-semibold text-court-navy/70">Upcoming clinics</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-court-navy/20 bg-white/60 py-8 text-center text-sm text-court-navy/50">
            No upcoming sign-ups yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((s) =>
              s.lateCancellation ? (
                <li
                  key={s.id}
                  className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-800"
                >
                  <span className="font-medium text-red-700">{s.kidName} — cancelled less than 24 hours</span>{" "}
                  <span className="text-red-700/50">(Age: {s.kidAge})</span> — {s.sessionLabel} on {s.sessionDate}
                  <p className="mt-0.5 text-xs text-red-700/70">Still billed per club policy.</p>
                </li>
              ) : (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-court-navy/10 bg-white px-4 py-3 shadow-card"
                >
                  <span className="text-sm">
                    {s.recurring && <span title="From a weekly sign-up">🔁 </span>}
                    <strong className="text-court-navy">{s.kidName}</strong>{" "}
                    <span className="text-court-navy/40">(Age: {s.kidAge})</span> — {s.sessionLabel} on {s.sessionDate}
                    {s.waitlisted && <em className="ml-1 font-medium text-court-gold">(waitlist)</em>}
                    {s.cancelled && <em className="ml-1 font-medium text-red-700">(clinic cancelled)</em>}
                  </span>
                  <button
                    onClick={() => cancelSignup(s.id)}
                    disabled={busyId === s.id}
                    className="shrink-0 text-sm font-semibold text-red-600 hover:underline disabled:opacity-40"
                  >
                    {busyId === s.id ? "Cancelling…" : "Cancel"}
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      {recurring.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-display text-base font-semibold text-court-navy/70">🔁 Weekly sign-ups</h2>
          <ul className="space-y-2">
            {recurring.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-court-navy/10 bg-white px-4 py-3 shadow-card"
              >
                <span className="text-sm">
                  <strong className="text-court-navy">{r.kidName}</strong>{" "}
                  <span className="text-court-navy/40">(Age: {r.kidAge})</span> — every {r.clinicLabel}
                </span>
                <button
                  onClick={() => stopRecurring(r.id)}
                  disabled={busyId === r.id}
                  className="shrink-0 text-sm font-semibold text-red-600 hover:underline disabled:opacity-40"
                >
                  {busyId === r.id ? "Stopping…" : "Stop"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-base font-semibold text-court-navy/70">History</h2>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-court-navy/20 bg-white/60 py-8 text-center text-sm text-court-navy/50">
            No past clinics yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-xl border border-court-navy/10 bg-white px-4 py-3 text-sm shadow-card">
                {h.lateCancellation ? (
                  <span className="font-medium text-red-700">
                    {h.kidName} — late cancellation
                  </span>
                ) : (
                  <strong className="text-court-navy">{h.kidName}</strong>
                )}{" "}
                <span className="text-court-navy/40">(Age: {h.kidAge})</span> — {h.sessionLabel} on {h.sessionDate}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
