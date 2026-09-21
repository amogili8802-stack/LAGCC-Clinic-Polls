"use client";

import { useState } from "react";
import Link from "next/link";

type Record = {
  id: string;
  kidName: string;
  memberStatus: string;
  sponsorName: string | null;
  parentPhone: string;
  clinicLabel: string;
  clinicDate: string;
  cancelledAt: string;
};

export default function BillingClient({ records: initialRecords }: { records: Record[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function dismiss(id: string) {
    if (!confirm("Clear this cancellation record? Only do this once billing is resolved.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/coach/signup/${id}`, { method: "DELETE" });
      if (res.ok) setRecords((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-court-navy/10 bg-white p-5 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-court-gold">Coach Dashboard</p>
          <h1 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-court-navy">
            Late Cancellations — Billing
          </h1>
          <p className="mt-0.5 text-sm text-court-navy/50">
            Every sign-up cancelled less than 24 hours before its clinic, across every week, in one place.
          </p>
        </div>
        <Link
          href="/coach/dashboard"
          className="rounded-full border border-court-navy/15 px-4 py-1.5 text-sm font-medium text-court-navy/70 transition hover:border-court-navy/30 hover:bg-court-navy/5"
        >
          Back to Dashboard
        </Link>
      </div>

      {records.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-court-navy/20 bg-white/60 py-10 text-center text-court-navy/50">
          No outstanding late cancellations.
        </p>
      ) : (
        <>
          {/* Table layout for sm+ screens */}
          <div className="hidden overflow-hidden rounded-2xl border border-court-navy/10 shadow-card sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-court-navy/[0.03] text-xs uppercase tracking-wide text-court-navy/40">
                  <th className="px-4 py-3 font-semibold">Child</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Clinic</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-court-navy/10 bg-red-50/40">
                    <td className="px-4 py-3 font-medium text-red-700">{r.kidName}</td>
                    <td className="px-4 py-3 text-red-700/70">
                      {r.memberStatus}
                      {r.sponsorName && <span className="block text-[11px] text-red-700/50">Sponsor: {r.sponsorName}</span>}
                    </td>
                    <td className="px-4 py-3 text-red-700/70">
                      {r.clinicLabel} — {r.clinicDate}
                    </td>
                    <td className="px-4 py-3 text-red-700/70">{r.parentPhone}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => dismiss(r.id)}
                        disabled={busyId === r.id}
                        className="font-semibold text-red-700/60 hover:underline disabled:opacity-40"
                      >
                        {busyId === r.id ? "Clearing…" : "Dismiss"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked cards for mobile */}
          <div className="space-y-2 sm:hidden">
            {records.map((r) => (
              <div key={r.id} className="rounded-xl border border-court-navy/10 bg-red-50/40 p-3 text-sm shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-red-700">{r.kidName}</p>
                  <button
                    onClick={() => dismiss(r.id)}
                    disabled={busyId === r.id}
                    className="shrink-0 font-semibold text-red-700/60 hover:underline disabled:opacity-40"
                  >
                    {busyId === r.id ? "Clearing…" : "Dismiss"}
                  </button>
                </div>
                <p className="mt-1 text-red-700/70">
                  {r.memberStatus}
                  {r.sponsorName && <span className="ml-1">· Sponsor: {r.sponsorName}</span>}
                </p>
                <p className="text-red-700/70">
                  {r.clinicLabel} — {r.clinicDate}
                </p>
                <p className="text-red-700/70">{r.parentPhone}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
