import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const signup = await prisma.signup.findUnique({ where: { id } });
  if (!signup) return NextResponse.json({ error: "Sign-up not found." }, { status: 404 });

  await prisma.signup.delete({ where: { id } });

  if (!signup.waitlisted) {
    const nextInLine = await prisma.signup.findFirst({
      where: { sessionId: signup.sessionId, waitlisted: true },
      orderBy: { createdAt: "asc" },
    });
    if (nextInLine) {
      await prisma.signup.update({ where: { id: nextInLine.id }, data: { waitlisted: false } });
    }
  }

  return NextResponse.json({ success: true });
}
