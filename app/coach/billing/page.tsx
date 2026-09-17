import { redirect } from "next/navigation";
import { getCoachSession } from "@/lib/coachAuth";
import { prisma } from "@/lib/prisma";
import { formatDateLong } from "@/lib/date";
import { formatTime } from "@/lib/clinics";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function CoachBillingPage() {
  const authSession = await getCoachSession();
  if (!authSession) redirect("/coach/login");

  const lateCancellations = await prisma.signup.findMany({
    where: { cancelledAt: { not: null }, lateCancellation: true },
    include: { session: { include: { template: true } } },
    orderBy: { cancelledAt: "desc" },
  });

  return (
    <BillingClient
      records={lateCancellations.map((s) => ({
        id: s.id,
        kidName: s.kidName,
        memberNumber: s.isNonMember ? "Non-member" : s.memberNumber,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        clinicLabel: `${s.session.template.name} (${formatTime(s.session.template.startTime)})`,
        clinicDate: formatDateLong(s.session.date),
        cancelledAt: s.cancelledAt!.toISOString(),
      }))}
    />
  );
}
