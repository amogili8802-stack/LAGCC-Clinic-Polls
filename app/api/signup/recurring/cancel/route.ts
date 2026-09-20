import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const recurringId = body?.recurringId as string | undefined;
  const phone = body?.phone as string | undefined;

  if (!recurringId || !phone) {
    return NextResponse.json({ error: "Missing recurring sign-up id or phone number." }, { status: 400 });
  }

  const recurring = await prisma.recurringSignup.findUnique({ where: { id: recurringId } });
  if (!recurring) return NextResponse.json({ error: "Recurring sign-up not found." }, { status: 404 });
  if (!samePhone(recurring.parentPhone, phone)) {
    return NextResponse.json({ error: "That phone number doesn't match this sign-up." }, { status: 403 });
  }

  await prisma.recurringSignup.update({
    where: { id: recurringId },
    data: { active: false, cancelledAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
