import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";
import { getCurrentParent } from "@/lib/parentAuth";

export async function POST(req: NextRequest) {
  const parent = await getCurrentParent();
  if (!parent) return NextResponse.json({ error: "Log in to manage your sign-ups." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const recurringId = body?.recurringId as string | undefined;
  if (!recurringId) return NextResponse.json({ error: "Missing recurring sign-up id." }, { status: 400 });

  const recurring = await prisma.recurringSignup.findUnique({ where: { id: recurringId } });
  if (!recurring) return NextResponse.json({ error: "Recurring sign-up not found." }, { status: 404 });
  const owned = recurring.parentId === parent.id || samePhone(recurring.parentPhone, parent.phone);
  if (!owned) {
    return NextResponse.json({ error: "That sign-up doesn't belong to your account." }, { status: 403 });
  }

  await prisma.recurringSignup.update({
    where: { id: recurringId },
    data: { active: false, cancelledAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
