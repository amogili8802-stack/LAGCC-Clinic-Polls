import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";
import { isLateCancellation } from "@/lib/date";
import { getCurrentParent } from "@/lib/parentAuth";

export async function POST(req: NextRequest) {
  const parent = await getCurrentParent();
  if (!parent) return NextResponse.json({ error: "Log in to manage your sign-ups." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const signupId = body?.signupId as string | undefined;
  if (!signupId) return NextResponse.json({ error: "Missing signup id." }, { status: 400 });

  const signup = await prisma.signup.findUnique({
    where: { id: signupId },
    include: { session: { include: { template: true } } },
  });
  if (!signup) return NextResponse.json({ error: "Sign-up not found." }, { status: 404 });
  const owned = signup.parentId === parent.id || samePhone(signup.parentPhone, parent.phone);
  if (!owned) {
    return NextResponse.json({ error: "That sign-up doesn't belong to your account." }, { status: 403 });
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
