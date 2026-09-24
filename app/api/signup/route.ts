import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { notifyCoaches } from "@/lib/notifyCoaches";
import { toE164, samePhone } from "@/lib/phone";
import { formatTime } from "@/lib/clinics";
import {
  formatDateLong,
  mondayOf,
  isWeekOpenForSignup,
  formatOpensAt,
  isSignupOpenForSession,
  formatSignupCutoff,
  addDays,
} from "@/lib/weeks";
import type { ClinicSession, ClinicTemplate } from "@prisma/client";

const clubName = process.env.CLUB_NAME || "The club";

type KidInput = { name: string; nonMember?: boolean; sponsorName?: string };

// Signs up the same kids for one clinic session and sends the matching
// parent + coach texts. Used for the session the parent picked, and again
// for next week's occurrence of the same clinic when they opt into the
// (2-week-max) repeat option below.
async function signUpKidsForSession(
  targetSession: ClinicSession & { template: ClinicTemplate },
  kids: KidInput[],
  parentPhone: string
) {
  const existing = await prisma.signup.findMany({ where: { sessionId: targetSession.id } });
  const activeCount = existing.filter((s) => !s.waitlisted && !s.cancelledAt).length;

  const created = await prisma.$transaction(
    kids.map((kid, i) =>
      prisma.signup.create({
        data: {
          sessionId: targetSession.id,
          parentPhone: parentPhone.trim(),
          kidName: kid.name.trim(),
          isNonMember: Boolean(kid.nonMember),
          sponsorName: kid.nonMember ? kid.sponsorName?.trim() : null,
          waitlisted: activeCount + i >= targetSession.capacity,
        },
      })
    )
  );

  const waitlistedCount = created.filter((s) => s.waitlisted).length;
  const confirmedNames = created.filter((s) => !s.waitlisted).map((s) => s.kidName);
  const waitlistedNames = created.filter((s) => s.waitlisted).map((s) => s.kidName);

  const dateLabel = formatDateLong(targetSession.date);
  const timeLabel = `${formatTime(targetSession.template.startTime)}-${formatTime(targetSession.template.endTime)}`;
  let smsBody = `${clubName} Tennis: `;
  if (confirmedNames.length > 0) {
    smsBody += `${confirmedNames.join(", ")} confirmed for ${targetSession.template.name} on ${dateLabel}, ${timeLabel}. `;
  }
  if (waitlistedNames.length > 0) {
    smsBody += `${waitlistedNames.join(", ")} added to the WAITLIST for ${targetSession.template.name} on ${dateLabel} (clinic is full). `;
  }
  smsBody += "Reply to the pro shop with any questions.";
  await sendSms(toE164(parentPhone), smsBody);

  const allNames = [...confirmedNames, ...waitlistedNames];
  let coachBody = `${clubName} Tennis: ${allNames.join(", ")} signed up for ${targetSession.template.name} on ${dateLabel}, ${timeLabel}`;
  if (waitlistedNames.length > 0) coachBody += ` (${waitlistedNames.length} on waitlist)`;
  coachBody += ".";
  await notifyCoaches(coachBody);

  return { waitlistedCount, confirmedCount: confirmedNames.length };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { sessionId, parentPhone, kids, repeatNextWeek } = body as {
    sessionId?: string;
    parentPhone?: string;
    kids?: KidInput[];
    repeatNextWeek?: boolean;
  };

  if (!sessionId || !parentPhone?.trim() || !Array.isArray(kids) || kids.length === 0) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (repeatNextWeek && kids.length > 2) {
    return NextResponse.json({ error: "Recurring sign-up is limited to 2 kids." }, { status: 400 });
  }
  for (const kid of kids) {
    if (!kid.name?.trim()) {
      return NextResponse.json({ error: "Each child needs a name." }, { status: 400 });
    }
    if (kid.nonMember && !kid.sponsorName?.trim()) {
      return NextResponse.json(
        { error: "Enter the sponsoring member's name for each non-member child." },
        { status: 400 }
      );
    }
  }

  const session = await prisma.clinicSession.findUnique({
    where: { id: sessionId },
    include: { template: true },
  });
  if (!session) return NextResponse.json({ error: "Clinic session not found." }, { status: 404 });
  if (session.status === "CANCELLED") {
    return NextResponse.json({ error: "This clinic has been cancelled." }, { status: 400 });
  }
  const weekStart = mondayOf(session.date);
  if (!isWeekOpenForSignup(weekStart)) {
    return NextResponse.json(
      { error: `Sign-ups for this week open ${formatOpensAt(weekStart)}.` },
      { status: 400 }
    );
  }
  if (!isSignupOpenForSession(session.date)) {
    return NextResponse.json(
      { error: `Sign-ups for this clinic closed ${formatSignupCutoff(session.date)}.` },
      { status: 400 }
    );
  }

  // Repeat is capped at one extra week — this + next week only — so a spot
  // doesn't get held indefinitely and other families still get a turn. A
  // family can only use it once per clinic: if they already have an active
  // sign-up in next week's occurrence of this same clinic, block another
  // recurring request outright rather than letting it stack on top.
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
        { error: "You already have a recurring sign-up for this clinic." },
        { status: 400 }
      );
    }
  }

  const { waitlistedCount, confirmedCount } = await signUpKidsForSession(session, kids, parentPhone);

  // The next-week session is created directly (bypassing the weekly release
  // gate, which only governs a parent browsing an unreleased week on their
  // own) since this is an extension of a sign-up already made this week.
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
      await signUpKidsForSession(nextWeekSession, kids, parentPhone);
      repeatedNextWeek = true;
    }
  }

  return NextResponse.json({
    success: true,
    waitlistedCount,
    confirmedCount,
    repeatedNextWeek,
  });
}
