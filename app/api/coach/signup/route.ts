import { NextRequest, NextResponse } from "next/server";
import { getCoachSession } from "@/lib/coachAuth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { toE164 } from "@/lib/phone";
import { formatTime } from "@/lib/clinics";
import { formatDateLong } from "@/lib/weeks";

const clubName = process.env.CLUB_NAME || "The club";

export async function POST(req: NextRequest) {
  const authSession = await getCoachSession();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { sessionId, kidName, isNonMember, parentPhone, skipWaitlist } = body || {};

  if (!sessionId || !kidName?.trim() || !parentPhone?.trim()) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const session = await prisma.clinicSession.findUnique({
    where: { id: sessionId },
    include: { template: true, signups: true },
  });
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  const activeCount = session.signups.filter((s) => !s.waitlisted && !s.cancelledAt).length;
  const waitlisted = !skipWaitlist && activeCount >= session.capacity;

  const signup = await prisma.signup.create({
    data: {
      sessionId,
      parentPhone: parentPhone.trim(),
      kidName: kidName.trim(),
      isNonMember: Boolean(isNonMember),
      waitlisted,
      addedByCoach: true,
    },
  });

  const dateLabel = formatDateLong(session.date);
  const timeLabel = `${formatTime(session.template.startTime)}-${formatTime(session.template.endTime)}`;
  const smsBody = waitlisted
    ? `${clubName} Tennis: ${kidName} added to the WAITLIST for ${session.template.name} on ${dateLabel} (${timeLabel}).`
    : `${clubName} Tennis: ${kidName} confirmed for ${session.template.name} on ${dateLabel} (${timeLabel}).`;
  await sendSms(toE164(parentPhone), smsBody);

  return NextResponse.json({ success: true, signup });
}
