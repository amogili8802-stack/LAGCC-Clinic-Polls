import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkSms } from "@/lib/sms";
import { toE164 } from "@/lib/phone";
import { formatTime } from "@/lib/clinics";
import { formatDateLong } from "@/lib/weeks";

const clubName = process.env.CLUB_NAME || "The club";

const REASON_LABELS: Record<string, string> = {
  RAIN: "rain",
  HEAT: "extreme heat",
  LOW_SIGNUPS: "not enough sign-ups",
  OTHER: "unforeseen circumstances",
};

const VALID_REASONS = new Set(["RAIN", "HEAT", "LOW_SIGNUPS", "OTHER"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const reason = body?.reason as string | undefined;
  const note = (body?.note as string | undefined)?.trim() || null;

  if (!reason || !VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: "Invalid cancellation reason." }, { status: 400 });
  }

  const session = await prisma.clinicSession.findUnique({
    where: { id: id },
    include: { template: true, signups: true },
  });
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  await prisma.clinicSession.update({
    where: { id: id },
    data: {
      status: "CANCELLED",
      cancellationReason: reason as "RAIN" | "HEAT" | "LOW_SIGNUPS" | "OTHER",
      cancellationNote: note,
      cancelledAt: new Date(),
      cancelledBy: authSession.user?.email || authSession.user?.name || "a coach",
    },
  });

  const dateLabel = formatDateLong(session.date);
  const timeLabel = `${formatTime(session.template.startTime)}-${formatTime(session.template.endTime)}`;
  let smsBody = `${clubName} Tennis: ${session.template.name} on ${dateLabel} (${timeLabel}) is CANCELLED due to ${REASON_LABELS[reason]}.`;
  if (note) smsBody += ` ${note}`;

  const phones = session.signups.map((s) => toE164(s.parentPhone));
  const results = await sendBulkSms(phones, smsBody);

  return NextResponse.json({ success: true, textsSent: results.filter((r) => r.ok).length });
}
