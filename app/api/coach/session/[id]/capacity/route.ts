import { NextRequest, NextResponse } from "next/server";
import { getCoachSession } from "@/lib/coachAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await getCoachSession();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const capacity = body?.capacity;
  const minSignups = body?.minSignups;

  if (typeof capacity !== "number" || capacity < 1 || capacity > 100) {
    return NextResponse.json({ error: "Capacity must be a number between 1 and 100." }, { status: 400 });
  }
  if (typeof minSignups !== "number" || minSignups < 0 || minSignups > capacity) {
    return NextResponse.json({ error: "Minimum sign-ups must be a number between 0 and capacity." }, { status: 400 });
  }

  await prisma.clinicSession.update({ where: { id }, data: { capacity, minSignups } });
  return NextResponse.json({ success: true });
}
