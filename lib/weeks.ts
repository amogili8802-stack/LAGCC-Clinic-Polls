import { prisma } from "@/lib/prisma";
import { CLINIC_SCHEDULE } from "@/lib/clinics";

// All date math here treats dates as plain calendar days at UTC midnight.
// The actual wall-clock time of the clinic (e.g. "3:30 PM") is stored/shown
// separately as a string on the template, so timezone drift on the Date
// object itself never matters.

export function toDateOnlyUTC(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

export function todayUTC(): Date {
  const now = new Date();
  return toDateOnlyUTC(now.getFullYear(), now.getMonth(), now.getDate());
}

// Monday of the week containing `date`.
export function mondayOf(date: Date): Date {
  const day = date.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const offsetFromMonday = (day + 6) % 7; // Mon->0, Tue->1, ..., Sun->6
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - offsetFromMonday);
  return monday;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function formatWeekParam(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function parseWeekParam(param: string): Date {
  const [y, m, d] = param.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) throw new Error("Invalid week param");
  return mondayOf(toDateOnlyUTC(y, m - 1, d));
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Day-of-week offset from Monday (0) used to place each template within a
// week that starts on Monday, even though ClinicTemplate.dayOfWeek uses the
// JS convention (0 = Sunday).
function offsetFromMonday(dayOfWeek: number): number {
  return (dayOfWeek + 6) % 7;
}

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
