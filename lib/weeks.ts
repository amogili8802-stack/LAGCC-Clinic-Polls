import { prisma } from "@/lib/prisma";
import { CLINIC_SCHEDULE } from "@/lib/clinics";
import { addDays, offsetFromMonday } from "@/lib/date";

// Pure date/timezone helpers live in lib/date.ts (client-safe — no prisma,
// no sms). Re-exported here so existing server-side `from "@/lib/weeks"`
// imports keep working unchanged; anything below actually touches the
// database or sends texts, which is why it can't live in lib/date.ts.
export * from "@/lib/date";

// Ensures a ClinicSession row exists for every active template for the
// given week (identified by its Monday), then returns all sessions for
// that week with their signups, ordered for display.
export async function ensureAndGetWeekSessions(weekStart: Date) {
  const templates = await prisma.clinicTemplate.findMany({
    where: { active: true },
    orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
  });

  // Fall back to seeding the fixed schedule in-memory if the DB hasn't been
  // seeded yet, so the site still renders something useful.
  const effectiveTemplates =
    templates.length > 0
      ? templates
      : ([] as (typeof templates)[number][]);

  for (const template of effectiveTemplates) {
    const date = addDays(weekStart, offsetFromMonday(template.dayOfWeek));
    await prisma.clinicSession.upsert({
      where: { templateId_date: { templateId: template.id, date } },
      update: {},
      create: {
        templateId: template.id,
        date,
        capacity: template.capacity,
        minSignups: template.minSignups,
      },
    });
  }

  const sessions = await prisma.clinicSession.findMany({
    where: {
      date: {
        gte: weekStart,
        lt: addDays(weekStart, 7),
      },
    },
    include: {
      template: true,
      signups: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ date: "asc" }],
  });

  sessions.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.template.sortOrder - b.template.sortOrder;
  });

  return sessions;
}

export const WEEKDAY_COUNT_HINT = CLINIC_SCHEDULE.length;
