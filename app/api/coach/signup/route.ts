import { NextRequest, NextResponse } from "next/server";
import { getCoachSession } from "@/lib/coachAuth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { notifyCoaches } from "@/lib/notifyCoaches";
import { toE164, samePhone } from "@/lib/phone";
import { formatTime } from "@/lib/clinics";
import { formatDateLong, addDays } from "@/lib/weeks";
import type { ClinicSession, ClinicTemplate } from "@prisma/client";

const clubName = process.env.CLUB_NAME || "The club";

async function addWalkIn(
  targetSession: ClinicSession & { template: ClinicTemplate },
  {
    kidName,
    isNonMember,
    sponsorName,
    parentPhone,
    skipWaitlist,
  }: { kidName: string; isNonMember: boolean; sponsorName?: string; parentPhone: string; skipWaitlist?: boolean }
) {
  const existing = await prisma.signup.findMany({ where: { sessionId: targetSession.id } });
  const activeCount = existing.filter((s) => !s.waitlisted && !s.cancelledAt).length;
  const waitlisted = !skipWaitlist && activeCount >= targetSession.capacity;

  const signup = await prisma.signup.create({
    data: {
      sessionId: targetSession.id,
      parentPhone: parentPhone.trim(),
      kidName: kidName.trim(),
      isNonMember: Boolean(isNonMember),
      sponsorName: isNonMember ? sponsorName?.trim() : null,
      waitlisted,
      addedByCoach: true,
    },
  });

  const dateLabel = formatDateLong(targetSession.date);
  const timeLabel = `${formatTime(targetSession.template.startTime)}-${formatTime(targetSession.template.endTime)}`;
  const smsBody = waitlisted
    ? `${clubName} Tennis: ${kidName} added to the WAITLIST for ${targetSession.template.name} on ${dateLabel} (${timeLabel}).`
    : `${clubName} Tennis: ${kidName} confirmed for ${targetSession.template.name} on ${dateLabel} (${timeLabel}).`;
  await sendSms(toE164(parentPhone), smsBody);

  const coachBody = waitlisted
    ? `${clubName} Tennis: ${kidName} added to the WAITLIST for ${targetSession.template.name} on ${dateLabel} (${timeLabel}) — walk-in.`
    : `${clubName} Tennis: ${kidName} signed up for ${targetSession.template.name} on ${dateLabel} (${timeLabel}) — walk-in.`;
  await notifyCoaches(coachBody);

  return signup;
}

export async function POST(req: NextRequest) {
  const authSession = await getCoachSession();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { sessionId, kidName, isNonMember, sponsorName, parentPhone, skipWaitlist, repeatNextWeek } = body || {};

  if (!sessionId || !kidName?.trim() || !parentPhone?.trim()) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (isNonMember && !sponsorName?.trim()) {
    return NextResponse.json(
      { error: "Enter the sponsoring member's name for a non-member sign-up." },
      { status: 400 }
    );
  }

  const session = await prisma.clinicSession.findUnique({
    where: { id: sessionId },
    include: { template: true },
  });
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  // Same 2-week cap as the public sign-up form's repeat option, and same
  // guard against re-using it to stack more sign-ups on an existing one.
  const nextWeekDate = addDays(session.date, 7);
  if (repeatNextWeek) {
    const existingNextWeek = await prisma.clinicSession.findUnique({
      where: { templateId_date: { templateId: session.templateId, date: nextWeekDate } },
      include: { signups: true },
    });
    const alreadyRecurring = existingNextWeek?.signups.some(
      (s) => !s.cancelledAt && samePhone(s.parentPhone, parentPhone)
    );
    if (alreadyRecurring) {
      return NextResponse.json(
        { error: "This family already has a recurring sign-up for this clinic." },
        { status: 400 }
      );
    }
  }

  const signup = await addWalkIn(session, { kidName, isNonMember, sponsorName, parentPhone, skipWaitlist });

  let repeatedNextWeek = false;
  if (repeatNextWeek) {
    const nextWeekSession = await prisma.clinicSession.upsert({
      where: { templateId_date: { templateId: session.templateId, date: nextWeekDate } },
      update: {},
      create: {
        templateId: session.templateId,
        date: nextWeekDate,
        capacity: session.template.capacity,
        minSignups: session.template.minSignups,
      },
      include: { template: true },
    });
    if (nextWeekSession.status !== "CANCELLED") {
      await addWalkIn(nextWeekSession, { kidName, isNonMember, sponsorName, parentPhone, skipWaitlist });
      repeatedNextWeek = true;
    }
  }

  return NextResponse.json({ success: true, signup, repeatedNextWeek });
}
