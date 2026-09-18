import { NextRequest, NextResponse } from "next/server";
import { getCoachSession } from "@/lib/coachAuth";
import { prisma } from "@/lib/prisma";

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
