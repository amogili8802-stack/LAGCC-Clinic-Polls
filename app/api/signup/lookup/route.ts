import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";
import { formatDateShort, todayUTC } from "@/lib/weeks";
import { formatTime } from "@/lib/clinics";

// Passwordless self-serve lookup: a parent types the phone number they
// signed up with — or, if they'd rather, the child's first and last name —
// and sees/cancels their own kids' sign-ups, no account needed. Late
// cancellations (still billed per club policy) stay visible until the
// clinic's date passes, styled red on the client — same as the old
// logged-in "My Account" page did before it was removed. Name-based lookup
// is a convenience, not real verification (same tradeoff as the public
// click-to-cancel flow): a common name could match another family's kid.
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  const firstName = req.nextUrl.searchParams.get("firstName")?.trim();
  const lastName = req.nextUrl.searchParams.get("lastName")?.trim();

  if (!phone && !(firstName && lastName)) {
    return NextResponse.json(
      { error: "Enter a phone number or the child's first and last name." },
      { status: 400 }
    );
  }

  const signups = await prisma.signup.findMany({
    where: {
      session: { date: { gte: todayUTC() } },
      OR: [{ cancelledAt: null }, { lateCancellation: true }],
    },
    include: { session: { include: { template: true } } },
    orderBy: { session: { date: "asc" } },
  });
  const matches = phone
    ? signups.filter((s) => samePhone(s.parentPhone, phone))
    : signups.filter((s) => `${firstName} ${lastName}`.trim().toLowerCase() === s.kidName.trim().toLowerCase());

  return NextResponse.json({
    signups: matches.map((s) => ({
      id: s.id,
      kidName: s.kidName,
      waitlisted: s.waitlisted,
      cancelled: s.session.status === "CANCELLED",
      lateCancellation: Boolean(s.cancelledAt && s.lateCancellation),
      sessionLabel: `${s.session.template.name} (${formatTime(s.session.template.startTime)})`,
      sessionDate: formatDateShort(s.session.date),
    })),
  });
}
