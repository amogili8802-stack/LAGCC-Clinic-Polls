import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone, toE164 } from "@/lib/phone";
import { isLateCancellation } from "@/lib/date";
import { notifyCoaches } from "@/lib/notifyCoaches";
import { sendSms } from "@/lib/sms";
import { formatDateLong } from "@/lib/weeks";
import { formatTime } from "@/lib/clinics";

const clubName = process.env.CLUB_NAME || "The club";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const signupId = body?.signupId as string | undefined;
  const phone = body?.phone as string | undefined;
  const firstName = body?.firstName as string | undefined;
  const lastName = body?.lastName as string | undefined;

  if (!signupId || (!phone && !(firstName?.trim() && lastName?.trim()))) {
    return NextResponse.json({ error: "Missing signup id and a phone number or name." }, { status: 400 });
  }

  const signup = await prisma.signup.findUnique({
    where: { id: signupId },
    include: { session: { include: { template: true } } },
  });
  if (!signup) return NextResponse.json({ error: "Sign-up not found." }, { status: 404 });

  const authorized = phone
    ? samePhone(signup.parentPhone, phone)
    : `${firstName} ${lastName}`.trim().toLowerCase() === signup.kidName.trim().toLowerCase();
  if (!authorized) {
    return NextResponse.json(
      { error: phone ? "That phone number doesn't match this sign-up." : "That name doesn't match this sign-up." },
      { status: 403 }
    );
  }
  if (signup.cancelledAt) return NextResponse.json({ success: true });

  const lateCancellation = isLateCancellation(signup.session.date, signup.session.template.startTime);

  await prisma.signup.update({
    where: { id: signupId },
    data: { cancelledAt: new Date(), lateCancellation },
  });

  // Freed a confirmed spot — promote the earliest waitlisted kid, if any.
  if (!signup.waitlisted) {
    const nextInLine = await prisma.signup.findFirst({
      where: { sessionId: signup.sessionId, waitlisted: true, cancelledAt: null },
      orderBy: { createdAt: "asc" },
    });
    if (nextInLine) {
      await prisma.signup.update({ where: { id: nextInLine.id }, data: { waitlisted: false } });
    }
  }

  const dateLabel = formatDateLong(signup.session.date);
  const timeLabel = `${formatTime(signup.session.template.startTime)}-${formatTime(signup.session.template.endTime)}`;

  if (signup.smsOptIn) {
    let parentBody = `${clubName} Tennis: ${signup.kidName}'s sign-up for ${signup.session.template.name} on ${dateLabel}, ${timeLabel} has been cancelled.`;
    if (lateCancellation) parentBody += " This is less than 24 hours before the clinic and is still billed per club policy.";
    await sendSms(toE164(signup.parentPhone), parentBody);
  }

  let coachBody = `${clubName} Tennis: ${signup.kidName} cancelled their sign-up for ${signup.session.template.name} on ${dateLabel}, ${timeLabel}.`;
  if (lateCancellation) coachBody += " Less than 24 hours out — still billed per club policy.";
  await notifyCoaches(coachBody);

  return NextResponse.json({ success: true, lateCancellation });
}
