import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const capacity = body?.capacity;
  if (typeof capacity !== "number" || capacity < 1 || capacity > 100) {
    return NextResponse.json({ error: "Capacity must be a number between 1 and 100." }, { status: 400 });
  }

  await prisma.clinicSession.update({ where: { id }, data: { capacity } });
  return NextResponse.json({ success: true });
}
