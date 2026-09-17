import { prisma } from "@/lib/prisma";
import { sendBulkSms } from "@/lib/sms";
import { toE164 } from "@/lib/phone";
import { formatTime } from "@/lib/clinics";
import { formatDateLong } from "@/lib/weeks";

const clubName = process.env.CLUB_NAME || "The club";

export const VALID_CANCELLATION_REASONS = new Set(["RAIN", "HEAT", "LOW_SIGNUPS", "OTHER"]);

export const CANCELLATION_REASON_LABELS: Record<string, string> = {
  RAIN: "rain",
  HEAT: "extreme heat",
  LOW_SIGNUPS: "not enough sign-ups",
  OTHER: "unforeseen circumstances",
};

// Marks a session cancelled and texts everyone signed up (including the
// waitlist). Shared by the coach's manual "Cancel Clinic" action and the
// automated low-sign-up cron job so both paths behave identically.
export async function cancelSessionAndNotify({
  sessionId,
  reason,
  note,
  cancelledBy,
}: {
  sessionId: string;
  reason: string;
  note?: string | null;
  cancelledBy: string;
}) {
  const session = await prisma.clinicSession.findUnique({
    where: { id: sessionId },
    include: { template: true, signups: true },
  });
  if (!session) return { ok: false as const, error: "Session not found." };
  if (session.status === "CANCELLED") return { ok: false as const, error: "Already cancelled." };

  await prisma.clinicSession.update({
    where: { id: sessionId },
    data: {
      status: "CANCELLED",
      cancellationReason: reason,
      cancellationNote: note || null,
      cancelledAt: new Date(),
      cancelledBy,
    },
  });

  const dateLabel = formatDateLong(session.date);
  const timeLabel = `${formatTime(session.template.startTime)}-${formatTime(session.template.endTime)}`;
  let smsBody = `${clubName} Tennis: ${session.template.name} on ${dateLabel} (${timeLabel}) is CANCELLED due to ${CANCELLATION_REASON_LABELS[reason] || "unforeseen circumstances"}.`;
  if (note) smsBody += ` ${note}`;

  const phones = session.signups.map((s) => toE164(s.parentPhone));
  const results = await sendBulkSms(phones, smsBody);

  return {
    ok: true as const,
    session,
    textsSent: results.filter((r) => r.ok).length,
  };
}
