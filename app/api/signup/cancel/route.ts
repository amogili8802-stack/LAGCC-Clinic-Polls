import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const signupId = body?.signupId as string | undefined;
  const parentPhone = body?.parentPhone as string | undefined;

  if (!signupId || !parentPhone) {
    return NextResponse.json({ error: "Missing signup id or phone number." }, { status: 400 });
  }

  const signup = await prisma.signup.findUnique({ where: { id: signupId } });
  if (!signup) return NextResponse.json({ error: "Sign-up not found." }, { status: 404 });
  if (!samePhone(signup.parentPhone, parentPhone)) {
    return NextResponse.json({ error: "That phone number doesn't match this sign-up." }, { status: 403 });
  }

  await prisma.signup.delete({ where: { id: signupId } });

  // Freed a confirmed spot — promote the earliest waitlisted kid, if any.
  if (!signup.waitlisted) {
    const nextInLine = await prisma.signup.findFirst({
      where: { sessionId: signup.sessionId, waitlisted: true },
      orderBy: { createdAt: "asc" },
    });
    if (nextInLine) {
      await prisma.signup.update({ where: { id: nextInLine.id }, data: { waitlisted: false } });
    }
  }

  return NextResponse.json({ success: true });
}
