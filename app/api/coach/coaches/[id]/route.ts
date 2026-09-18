import { NextRequest, NextResponse } from "next/server";
import { getCoachSession } from "@/lib/coachAuth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

// Lets a coach add/update another coach's phone number after the fact —
// needed for accounts (like the seeded head coach) that existed before
// phone numbers were collected, so they can still opt in to cancellation
// texts without being deleted and re-added.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getCoachSession();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const rawPhone = (body?.phone as string | undefined)?.trim();

  let phone: string | null = null;
  if (rawPhone) {
    phone = normalizePhone(rawPhone);
    if (phone.length < 10) {
      return NextResponse.json({ error: "Enter a valid phone number, or leave it blank." }, { status: 400 });
    }
  }

  const coach = await prisma.coach.findUnique({ where: { id } });
  if (!coach) return NextResponse.json({ error: "Coach not found." }, { status: 404 });

  const updated = await prisma.coach.update({
    where: { id },
    data: { phone },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  return NextResponse.json({ success: true, coach: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getCoachSession();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const totalCoaches = await prisma.coach.count();
  if (totalCoaches <= 1) {
    return NextResponse.json(
      { error: "Can't remove the last coach account — add another coach first." },
      { status: 400 }
    );
  }

  const coach = await prisma.coach.findUnique({ where: { id } });
  if (!coach) return NextResponse.json({ error: "Coach not found." }, { status: 404 });

  await prisma.coach.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
