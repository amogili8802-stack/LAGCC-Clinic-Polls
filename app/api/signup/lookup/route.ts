import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";
import { formatDateShort, todayUTC } from "@/lib/weeks";
import { formatTime } from "@/lib/clinics";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });

  const signups = await prisma.signup.findMany({
    where: { session: { date: { gte: todayUTC() } } },
    include: { session: { include: { template: true } } },
    orderBy: { session: { date: "asc" } },
  });

  const matches = signups.filter((s) => samePhone(s.parentPhone, phone));

  const recurring = await prisma.recurringSignup.findMany({
    where: { active: true },
    include: { template: true },
  });
  const recurringMatches = recurring.filter((r) => samePhone(r.parentPhone, phone));

  return NextResponse.json({
    signups: matches.map((s) => ({
      id: s.id,
      kidName: s.kidName,
      kidAge: s.kidAge,
      waitlisted: s.waitlisted,
      cancelled: s.session.status === "CANCELLED",
      sessionLabel: `${s.session.template.name} (${formatTime(s.session.template.startTime)})`,
      sessionDate: formatDateShort(s.session.date),
      recurring: Boolean(s.recurringSignupId),
    })),
    recurring: recurringMatches.map((r) => ({
      id: r.id,
      kidName: r.kidName,
      kidAge: r.kidAge,
      clinicLabel: `${r.template.name} (${formatTime(r.template.startTime)})`,
    })),
  });
}
