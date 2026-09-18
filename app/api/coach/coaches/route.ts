import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCoachSession } from "@/lib/coachAuth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

// Only an already-logged-in coach can see or add other coaches — there's
// no public coach registration, so this is the only way a new coach
// account gets created (besides the one seeded from SEED_COACH_EMAIL).
export async function GET() {
  const authSession = await getCoachSession();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coaches = await prisma.coach.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  return NextResponse.json({ coaches });
}

export async function POST(req: NextRequest) {
  const authSession = await getCoachSession();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const password = body?.password as string | undefined;
  const rawPhone = (body?.phone as string | undefined)?.trim();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  let phone: string | null = null;
  if (rawPhone) {
    phone = normalizePhone(rawPhone);
    if (phone.length < 10) {
      return NextResponse.json({ error: "Enter a valid phone number, or leave it blank." }, { status: 400 });
    }
  }

  const existing = await prisma.coach.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A coach account already exists for that email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const coach = await prisma.coach.create({
    data: { name, email, phone, passwordHash },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  return NextResponse.json({ success: true, coach });
}
