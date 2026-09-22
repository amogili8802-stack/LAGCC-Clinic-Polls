import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { notifyCoaches } from "@/lib/notifyCoaches";
import { toE164 } from "@/lib/phone";
import { formatTime } from "@/lib/clinics";
import {
  formatDateLong,
  mondayOf,
  isWeekOpenForSignup,
  formatOpensAt,
  isSignupOpenForSession,
  formatSignupCutoff,
} from "@/lib/weeks";

const clubName = process.env.CLUB_NAME || "The club";

type KidInput = { name: string; nonMember?: boolean; sponsorName?: string };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { sessionId, parentPhone, kids } = body as {
    sessionId?: string;
    parentPhone?: string;
    kids?: KidInput[];
  };

  if (!sessionId || !parentPhone?.trim() || !Array.isArray(kids) || kids.length === 0) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
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
    include: { template: true, signups: true },
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

  const activeCount = session.signups.filter((s) => !s.waitlisted && !s.cancelledAt).length;

  const created = await prisma.$transaction(
    kids.map((kid, i) =>
      prisma.signup.create({
        data: {
          sessionId,
          parentPhone: parentPhone.trim(),
          kidName: kid.name.trim(),
          isNonMember: Boolean(kid.nonMember),
          sponsorName: kid.nonMember ? kid.sponsorName?.trim() : null,
          waitlisted: activeCount + i >= session.capacity,
        },
      })
    )
  );

  const waitlistedCount = created.filter((s) => s.waitlisted).length;
  const confirmedNames = created.filter((s) => !s.waitlisted).map((s) => s.kidName);
  const waitlistedNames = created.filter((s) => s.waitlisted).map((s) => s.kidName);

  const dateLabel = formatDateLong(session.date);
  const timeLabel = `${formatTime(session.template.startTime)}-${formatTime(session.template.endTime)}`;
  let smsBody = `${clubName} Tennis: `;
  if (confirmedNames.length > 0) {
    smsBody += `${confirmedNames.join(", ")} confirmed for ${session.template.name} on ${dateLabel}, ${timeLabel}. `;
  }
  if (waitlistedNames.length > 0) {
    smsBody += `${waitlistedNames.join(", ")} added to the WAITLIST for ${session.template.name} on ${dateLabel} (clinic is full). `;
  }
  smsBody += "Reply to the pro shop with any questions.";

  await sendSms(toE164(parentPhone), smsBody);

  const allNames = [...confirmedNames, ...waitlistedNames];
  let coachBody = `${clubName} Tennis: ${allNames.join(", ")} signed up for ${session.template.name} on ${dateLabel}, ${timeLabel}`;
  if (waitlistedNames.length > 0) coachBody += ` (${waitlistedNames.length} on waitlist)`;
  coachBody += ".";
  await notifyCoaches(coachBody);

  return NextResponse.json({
    success: true,
    waitlistedCount,
    confirmedCount: confirmedNames.length,
  });
}
