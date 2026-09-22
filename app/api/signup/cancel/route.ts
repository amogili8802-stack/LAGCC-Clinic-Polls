import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";
import { isLateCancellation } from "@/lib/date";

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

  return NextResponse.json({ success: true, lateCancellation });
}
