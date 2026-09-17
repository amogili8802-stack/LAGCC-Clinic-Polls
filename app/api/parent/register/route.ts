import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizePhone, samePhone } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const rawPhone = body?.phone as string | undefined;
  const email = (body?.email as string | undefined)?.trim();
  const password = body?.password as string | undefined;

  if (!name || !rawPhone?.trim() || !password) {
    return NextResponse.json({ error: "Name, phone number, and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  const phone = normalizePhone(rawPhone);
  if (phone.length < 10) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  const existing = await prisma.parent.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      { error: "An account already exists for that phone number. Try logging in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const parent = await prisma.parent.create({
    data: { phone, name, email: email || null, passwordHash },
  });

  // Link any sign-ups made the old way (guest sign-up by phone, before
  // accounts existed) into this new account so nothing is orphaned.
  const orphanSignups = await prisma.signup.findMany({ where: { parentId: null } });
  const matchingSignupIds = orphanSignups.filter((s) => samePhone(s.parentPhone, phone)).map((s) => s.id);
  if (matchingSignupIds.length > 0) {
    await prisma.signup.updateMany({ where: { id: { in: matchingSignupIds } }, data: { parentId: parent.id } });
  }

  const orphanRecurring = await prisma.recurringSignup.findMany({ where: { parentId: null } });
  const matchingRecurringIds = orphanRecurring.filter((r) => samePhone(r.parentPhone, phone)).map((r) => r.id);
  if (matchingRecurringIds.length > 0) {
    await prisma.recurringSignup.updateMany({
      where: { id: { in: matchingRecurringIds } },
      data: { parentId: parent.id },
    });
  }

  return NextResponse.json({ success: true });
}
