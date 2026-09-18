import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelSessionAndNotify, notifyClinicIsOn } from "@/lib/cancelSession";
import { addDays, todayUTC } from "@/lib/weeks";

// Scheduled by vercel.json to run once a day around 8pm the day before each
// clinic. Any SCHEDULED session happening "tomorrow" gets checked against
// its minimum sign-up count: under the minimum, it's auto-cancelled and
// everyone signed up (plus the waitlist) gets a text explaining why; at or
// above it, everyone attending gets a text confirming the clinic is on.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const tomorrow = addDays(todayUTC(), 1);

  const sessions = await prisma.clinicSession.findMany({
    where: { status: "SCHEDULED", date: tomorrow },
    include: { signups: true, template: true },
  });

  const cancelled: string[] = [];
  const confirmed: string[] = [];
  for (const session of sessions) {
    // Late cancellations are still billed, so they still count toward
    // whether the clinic is viable — only empty and early-cancelled spots
    // pull the count down.
    const countedSignups = session.signups.filter(
      (s) => !s.waitlisted && (!s.cancelledAt || s.lateCancellation)
    ).length;

    if (countedSignups < session.minSignups) {
      const result = await cancelSessionAndNotify({
        sessionId: session.id,
        reason: "LOW_SIGNUPS",
        note: `Needed at least ${session.minSignups} sign-ups by 8pm the day before; had ${countedSignups}.`,
        cancelledBy: "Automatic (low sign-ups)",
      });
      if (result.ok) {
        cancelled.push(`${session.template.name} (${session.id})`);
      }
    } else {
      await notifyClinicIsOn(session.id);
      confirmed.push(`${session.template.name} (${session.id})`);
    }
  }

  return NextResponse.json({ checked: sessions.length, cancelled, confirmed });
}
