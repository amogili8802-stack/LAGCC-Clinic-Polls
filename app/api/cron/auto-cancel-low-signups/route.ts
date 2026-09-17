import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelSessionAndNotify } from "@/lib/cancelSession";
import { addDays, todayUTC } from "@/lib/weeks";

// Scheduled by vercel.json to run once a day around 8pm the day before each
// clinic. Any SCHEDULED session happening "tomorrow" that hasn't hit its
// minimum sign-up count gets auto-cancelled and everyone signed up (plus
// the waitlist) gets a text explaining why.
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
  for (const session of sessions) {
    const activeCount = session.signups.filter((s) => !s.waitlisted).length;
    if (activeCount < session.minSignups) {
      const result = await cancelSessionAndNotify({
        sessionId: session.id,
        reason: "LOW_SIGNUPS",
        note: `Needed at least ${session.minSignups} sign-ups by 8pm the day before; had ${activeCount}.`,
        cancelledBy: "Automatic (low sign-ups)",
      });
      if (result.ok) {
        cancelled.push(`${session.template.name} (${session.id})`);
      }
    }
  }

  return NextResponse.json({ checked: sessions.length, cancelled });
}
