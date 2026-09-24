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
  const [repeatNextWeek, setRepeatNextWeek] = useState(false);
  const [showRoster, setShowRoster] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelFirstName, setCancelFirstName] = useState("");
  const [cancelLastName, setCancelLastName] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const activeSignups = session.signups.filter((s) => !s.waitlisted && !s.cancelledAt);
  const waitlisted = session.signups.filter((s) => s.waitlisted && !s.cancelledAt);
  const cancelable = [...activeSignups, ...waitlisted];
  const spotsLeft = Math.max(0, session.capacity - activeSignups.length);
  const isFull = spotsLeft === 0;
  const isCancelled = session.status === "CANCELLED";

  function selectForCancel(id: string) {
    setCancelingId((prev) => (prev === id ? null : id));
    setCancelFirstName("");
    setCancelLastName("");
    setCancelError(null);
  }

  async function confirmCancel(id: string) {
    setCancelError(null);
    if (!cancelFirstName.trim() || !cancelLastName.trim()) {
      setCancelError("Enter the child's first and last name.");
      return;
    }
    setCancelSubmitting(true);
    try {
      const res = await fetch("/api/signup/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signupId: id,
          firstName: cancelFirstName.trim(),
          lastName: cancelLastName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || "Couldn't cancel. Please try again.");
        return;
      }
      window.location.reload();
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancelSubmitting(false);
    }
  }

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
          repeatNextWeek,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      const base =
        data.waitlistedCount > 0
          ? `Signed up! ${data.waitlistedCount} of your ${cleanedKids.length} child(ren) were added to the waitlist since this clinic is full.`
          : "You're signed up!";
      setSuccess(data.repeatedNextWeek ? `${base} You're also signed up for next week.` : base);
      setParentPhone("");
      setKids([{ firstName: "", lastName: "", nonMember: false, sponsorName: "" }]);
      setRepeatNextWeek(false);
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
      className={`group rounded-2xl border p-5 shadow-card transition hover:shadow-cardHover ${
        isCancelled ? "border-red-100 bg-red-50/60" : "border-court-navy/10 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        <div className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
          Cancelled — {REASON_LABELS[session.cancellationReason || "OTHER"]}
          {session.cancellationNote ? `: ${session.cancellationNote}` : ""}
        </div>
      )}
      {!isCancelled && !signupOpen && (
        <div className="mt-3 rounded-lg bg-court-navy/[0.04] px-3 py-2 text-sm text-court-navy/60">
          Sign-ups closed at 8:00 PM the night before this clinic.
        </div>
      )}

      {cancelable.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowRoster((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-court-greenDark transition hover:text-court-green"
          >
            Signed up ({activeSignups.length})
            {waitlisted.length > 0 && ` · +${waitlisted.length} waitlist`}
            <span className={`transition-transform ${showRoster ? "rotate-180" : ""}`} aria-hidden>
              ▾
            </span>
          </button>

          {showRoster && (
            <>
              {activeSignups.length > 0 && (
                <ul className="mt-1.5 flex flex-col items-start gap-1.5 text-sm">
                  {activeSignups.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => selectForCancel(s.id)}
                        className={`rounded-full border px-3 py-1 font-semibold transition ${
                          cancelingId === s.id
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-court-green/30 bg-court-green/10 text-court-greenDark hover:bg-court-green/20"
                        }`}
                      >
                        {s.kidName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {waitlisted.length > 0 && (
                <>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-court-clay">Waitlist</p>
                  <ul className="mt-1 flex flex-col items-start gap-1.5 text-sm">
                    {waitlisted.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => selectForCancel(s.id)}
                          className={`rounded-full border px-3 py-1 font-semibold transition ${
                            cancelingId === s.id
                              ? "border-red-300 bg-red-50 text-red-700"
                              : "border-court-clay/40 bg-court-clay/10 text-court-clay hover:bg-court-clay/20"
                          }`}
                        >
                          {s.kidName}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {cancelingId && cancelable.some((s) => s.id === cancelingId) && (
                <div className="mt-2 max-w-sm rounded-lg border border-red-200 bg-red-50/70 p-3">
                  <p className="text-sm font-medium text-red-800">
                    Cancel {cancelable.find((s) => s.id === cancelingId)?.kidName}&apos;s sign-up?
                  </p>
                  <p className="mt-0.5 text-xs text-red-700/70">
                    Cancelling less than 24 hours before the clinic still incurs a charge, per club policy.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="First name"
                      value={cancelFirstName}
                      onChange={(e) => setCancelFirstName(e.target.value)}
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      value={cancelLastName}
                      onChange={(e) => setCancelLastName(e.target.value)}
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  {cancelError && <p className="mt-1.5 text-xs font-medium text-red-700">{cancelError}</p>}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => confirmCancel(cancelingId)}
                      disabled={cancelSubmitting}
                      className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {cancelSubmitting ? "Cancelling…" : "Cancel Sign-up"}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectForCancel(cancelingId)}
                      className="rounded-full px-4 py-1.5 text-xs font-medium text-court-navy/50 transition hover:bg-court-navy/5"
                    >
                      Never mind
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!isCancelled && signupOpen && (
        <div className="mt-4">
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
              <p className="text-xs leading-relaxed text-court-navy/50">
                By providing your phone number and signing up, you agree to receive SMS text messages about
                your clinic sign-up (confirmations, waitlist status, and cancellation notices). Msg &amp; data
                rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help. See our{" "}
                <a href="/privacy" className="underline hover:text-court-navy/70">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="/terms" className="underline hover:text-court-navy/70">
                  Terms
                </a>
                .
              </p>

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

              <label className="flex items-start gap-2 rounded-lg border border-court-navy/10 bg-white p-2.5 text-xs font-medium text-court-navy/70">
                <input
                  type="checkbox"
                  checked={repeatNextWeek}
                  onChange={(e) => setRepeatNextWeek(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-court-navy/30 text-court-green focus:ring-court-green/30"
                />
                <span>
                  Also sign up for next week (same day &amp; time)
                  <span className="block font-normal text-court-navy/40">
                    Limited to this week + next week, so everyone gets a fair turn — you&apos;ll need to sign up
                    again after that.
                  </span>
                </span>
              </label>

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
