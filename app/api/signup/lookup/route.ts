import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";
import { formatDateShort, todayUTC } from "@/lib/weeks";
import { formatTime } from "@/lib/clinics";

// Passwordless self-serve lookup: a parent types the phone number they
// signed up with and sees/cancels their own kids' sign-ups, no account
// needed. Late cancellations (still billed per club policy) stay visible
// until the clinic's date passes, styled red on the client — same as the
// old logged-in "My Account" page did before it was removed.
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });

  const signups = await prisma.signup.findMany({
    where: {
      session: { date: { gte: todayUTC() } },
      OR: [{ cancelledAt: null }, { lateCancellation: true }],
    },
    include: { session: { include: { template: true } } },
    orderBy: { session: { date: "asc" } },
  });
  const matches = signups.filter((s) => samePhone(s.parentPhone, phone));

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
