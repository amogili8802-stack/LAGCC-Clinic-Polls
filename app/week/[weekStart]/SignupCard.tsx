"use client";

import { useState } from "react";
import { formatTime } from "@/lib/clinics";

type Signup = {
  id: string;
  kidName: string;
  isNonMember: boolean;
  waitlisted: boolean;
  cancelledAt?: string | null;
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

// The auto-cancel note includes the exact head count ("...; had 0.") for
// coaches' benefit on the dashboard — parents just need to know a minimum
// wasn't met, not how many kids were actually signed up.
function parentFacingNote(note: string | null | undefined): string {
  if (!note) return "";
  return note.replace(/;\s*had \d+\.?$/, ".");
}

type KidRow = {
  firstName: string;
  lastName: string;
  nonMember: boolean;
  sponsorName: string;
};

export default function SignupCard({ session, signupOpen }: { session: SessionForCard; signupOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parentPhone, setParentPhone] = useState("");
  const [kids, setKids] = useState<KidRow[]>([{ firstName: "", lastName: "", nonMember: false, sponsorName: "" }]);

  const activeSignups = session.signups.filter((s) => !s.waitlisted && !s.cancelledAt);
  const waitlisted = session.signups.filter((s) => s.waitlisted && !s.cancelledAt);
  const spotsLeft = Math.max(0, session.capacity - activeSignups.length);
  const isFull = spotsLeft === 0;
  const isCancelled = session.status === "CANCELLED";

  function updateKid(i: number, field: "firstName" | "lastName" | "sponsorName", value: string) {
    setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, [field]: value } : k)));
  }

  function toggleNonMember(i: number) {
    setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, nonMember: !k.nonMember } : k)));
  }

  function addKidRow() {
    setKids((prev) => [...prev, { firstName: "", lastName: "", nonMember: false, sponsorName: "" }]);
  }

  function removeKidRow(i: number) {
    setKids((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanedKids = kids
      .map((k) => ({
        firstName: k.firstName.trim(),
        lastName: k.lastName.trim(),
        nonMember: k.nonMember,
        sponsorName: k.sponsorName.trim(),
      }))
      .filter((k) => k.firstName.length > 0 || k.lastName.length > 0);

    if (!parentPhone.trim()) {
      setError("Cell phone number is required.");
      return;
    }
    if (cleanedKids.length === 0) {
      setError("Add at least one child.");
      return;
    }
    if (cleanedKids.some((k) => k.firstName.length === 0 || k.lastName.length === 0)) {
      setError("Enter a first and last name for each child.");
      return;
    }
    if (cleanedKids.some((k) => k.nonMember && k.sponsorName.length === 0)) {
      setError("Enter the sponsoring member's name for each non-member child.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          parentPhone: parentPhone.trim(),
          kids: cleanedKids.map((k) => ({
            name: `${k.firstName} ${k.lastName}`.trim(),
            nonMember: k.nonMember,
            sponsorName: k.nonMember ? k.sponsorName : undefined,
          })),
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
      setParentPhone("");
      setKids([{ firstName: "", lastName: "", nonMember: false, sponsorName: "" }]);
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
        isCancelled ? "border-red-100 bg-red-50/60" : "border-court-navy/10 bg-white"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${isCancelled ? "bg-red-300" : "bg-court-green"}`} />
      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-court-navy">{session.template.name}</h3>
          <p className="mt-0.5 text-sm text-court-navy/50">
            Ages {session.template.ageMin}-{session.template.ageMax} &middot;{" "}
            {formatTime(session.template.startTime)}–{formatTime(session.template.endTime)}
          </p>
        </div>
        {!isCancelled && (
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white ${
              !signupOpen ? "bg-court-navy/40" : isFull ? "bg-court-clay" : "bg-court-green"
            }`}
          >
            {!signupOpen
              ? "Sign-ups closed"
              : isFull
              ? "Full — waitlist open"
              : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
          </span>
        )}
      </div>

      {isCancelled && (
        <div className="mt-3 ml-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
          Cancelled — {REASON_LABELS[session.cancellationReason || "OTHER"]}
          {session.cancellationNote ? `: ${parentFacingNote(session.cancellationNote)}` : ""}
        </div>
      )}
      {!isCancelled && !signupOpen && (
        <div className="mt-3 ml-2 rounded-lg bg-court-navy/[0.04] px-3 py-2 text-sm text-court-navy/60">
          Sign-ups closed at 8:00 PM the night before this clinic.
        </div>
      )}

      {activeSignups.length > 0 && (
        <div className="mt-3 ml-2">
          <p className="text-xs font-bold uppercase tracking-wide text-court-greenDark">
            Signed up ({activeSignups.length})
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5 text-sm">
            {activeSignups.map((s) => (
              <li
                key={s.id}
                className="rounded-full border border-court-green/30 bg-court-green/10 px-3 py-1 font-semibold text-court-greenDark"
              >
                {s.kidName}
              </li>
            ))}
          </ul>
        </div>
      )}
      {waitlisted.length > 0 && (
        <div className="mt-2 ml-2">
          <p className="text-xs font-bold uppercase tracking-wide text-court-clay">
            Waitlist ({waitlisted.length})
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5 text-sm">
            {waitlisted.map((s) => (
              <li
                key={s.id}
                className="rounded-full border border-court-clay/40 bg-court-clay/10 px-3 py-1 font-semibold text-court-clay"
              >
                {s.kidName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isCancelled && signupOpen && (
        <div className="ml-2 mt-4">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="group/btn inline-flex items-center gap-1.5 rounded-full bg-court-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-court-greenDark hover:shadow-md"
            >
              {isFull ? "Join Waitlist" : "Sign Up"}
              <span aria-hidden className="transition-transform group-hover/btn:translate-x-0.5">
                →
              </span>
            </button>
          ) : (
            <form onSubmit={submit} className="mt-2 space-y-3 rounded-xl border border-court-navy/10 bg-court-cream/50 p-4">
              <input
                type="tel"
                placeholder="Cell phone (for text updates)"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className={`w-full ${inputClass}`}
                required
              />

              <div className="space-y-2 border-t border-court-navy/10 pt-3">
                {kids.map((kid, i) => (
                  <div key={i} className="space-y-1.5 rounded-lg border border-court-navy/10 bg-white p-2.5">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        placeholder="First name"
                        value={kid.firstName}
                        onChange={(e) => updateKid(i, "firstName", e.target.value)}
                        className={`min-w-[7rem] flex-1 ${inputClass}`}
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={kid.lastName}
                        onChange={(e) => updateKid(i, "lastName", e.target.value)}
                        className={`min-w-[7rem] flex-1 ${inputClass}`}
                      />
                      {kids.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeKidRow(i)}
                          className="px-2 text-sm text-court-navy/30 transition hover:text-red-600"
                          aria-label="Remove child"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <label className="flex items-center gap-2 px-0.5 py-0.5 text-xs font-medium text-court-navy/70">
                      <input
                        type="checkbox"
                        checked={kid.nonMember}
                        onChange={() => toggleNonMember(i)}
                        className="h-3.5 w-3.5 rounded border-court-navy/30 text-court-green focus:ring-court-green/30"
                      />
                      Non-member
                    </label>
                    {kid.nonMember && (
                      <input
                        type="text"
                        placeholder="Member name (who's sponsoring this guest?)"
                        value={kid.sponsorName}
                        onChange={(e) => updateKid(i, "sponsorName", e.target.value)}
                        className={`w-full ${inputClass}`}
                      />
                    )}
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
                  className="rounded-full px-5 py-2 text-sm font-medium text-court-navy/50 transition hover:bg-court-navy/5"
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
