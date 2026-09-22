import { prisma } from "@/lib/prisma";
import { sendBulkSms } from "@/lib/sms";
import { toE164 } from "@/lib/phone";

// Texts every coach who has a phone number on file — used for sign-up and
// self-service cancellation alerts, separate from the mass "clinic
// cancelled" notification in lib/cancelSession.ts.
export async function notifyCoaches(body: string) {
  const coaches = await prisma.coach.findMany({ where: { phone: { not: null } } });
  const phones = coaches.map((c) => toE164(c.phone!));
  if (phones.length === 0) return [];
  return sendBulkSms(phones, body);
}
