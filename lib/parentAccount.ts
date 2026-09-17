import { prisma } from "@/lib/prisma";
import { formatDateShort, todayUTC } from "@/lib/date";
import { formatTime } from "@/lib/clinics";

// Shared shaping logic for a parent's "my account" view — used by both the
// account page (server-rendered) and /api/parent/me (client refresh after
// cancelling something).
export async function getParentAccountView(parentId: string) {
  const [upcomingSignups, recurring, pastSignups] = await Promise.all([
    prisma.signup.findMany({
      where: { parentId, cancelledAt: null, session: { date: { gte: todayUTC() } } },
      include: { session: { include: { template: true } } },
      orderBy: { session: { date: "asc" } },
    }),
    prisma.recurringSignup.findMany({
      where: { parentId, active: true },
      include: { template: true },
    }),
    prisma.signup.findMany({
      where: { parentId, session: { date: { lt: todayUTC() } } },
      include: { session: { include: { template: true } } },
      orderBy: { session: { date: "desc" } },
    }),
  ]);

  const history = pastSignups
    .filter(
      (s) =>
        (s.cancelledAt && s.lateCancellation) ||
        (!s.cancelledAt && !s.waitlisted && s.session.status !== "CANCELLED")
    )
    .map((s) => ({
      id: s.id,
      kidName: s.kidName,
      kidAge: s.kidAge,
      sessionLabel: `${s.session.template.name} (${formatTime(s.session.template.startTime)})`,
      sessionDate: formatDateShort(s.session.date),
      lateCancellation: Boolean(s.cancelledAt && s.lateCancellation),
    }));

  return {
    upcoming: upcomingSignups.map((s) => ({
      id: s.id,
      kidName: s.kidName,
      kidAge: s.kidAge,
      waitlisted: s.waitlisted,
      cancelled: s.session.status === "CANCELLED",
      sessionLabel: `${s.session.template.name} (${formatTime(s.session.template.startTime)})`,
      sessionDate: formatDateShort(s.session.date),
      recurring: Boolean(s.recurringSignupId),
    })),
    recurring: recurring.map((r) => ({
      id: r.id,
      kidName: r.kidName,
      kidAge: r.kidAge,
      clinicLabel: `${r.template.name} (${formatTime(r.template.startTime)})`,
    })),
    history,
  };
}
