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

  // Skip promotion if this signup was already soft-cancelled — the
  // self-serve cancel route already promoted the next waitlisted kid at
  // that point, so doing it again here would double-promote.
  if (!signup.waitlisted && !signup.cancelledAt) {
    const nextInLine = await prisma.signup.findFirst({
      where: { sessionId: signup.sessionId, waitlisted: true, cancelledAt: null },
      orderBy: { createdAt: "asc" },
    });
    if (nextInLine) {
      await prisma.signup.update({ where: { id: nextInLine.id }, data: { waitlisted: false } });
    }
  }

  return NextResponse.json({ success: true });
}
