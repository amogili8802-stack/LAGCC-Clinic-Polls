import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await prisma.clinicSession.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  await prisma.clinicSession.update({
    where: { id },
    data: {
      status: "SCHEDULED",
      cancellationReason: null,
      cancellationNote: null,
      cancelledAt: null,
      cancelledBy: null,
    },
  });

  return NextResponse.json({ success: true });
}
