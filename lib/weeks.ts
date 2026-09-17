import { prisma } from "@/lib/prisma";
import { CLINIC_SCHEDULE, formatTime } from "@/lib/clinics";
import { sendSms } from "@/lib/sms";
import { toE164, samePhone } from "@/lib/phone";
import { addDays, formatDateLong, offsetFromMonday } from "@/lib/date";

// Pure date/timezone helpers live in lib/date.ts (client-safe — no prisma,
// no sms). Re-exported here so existing server-side `from "@/lib/weeks"`
// imports keep working unchanged; anything below actually touches the
// database or sends texts, which is why it can't live in lib/date.ts.
export * from "@/lib/date";

const clubName = process.env.CLUB_NAME || "The club";

// Auto-enrolls every active RecurringSignup into this week's session for
// its clinic, if it isn't already enrolled. Runs as part of
// ensureAndGetWeekSessions so it happens the moment anyone (a parent or a
// coach) first loads a week after it's been created — no separate cron
// needed, matching how session rows themselves get lazily created.
async function syncRecurringSignupsForWeek(
  weekStart: Date,
  templates: { id: string; dayOfWeek: number }[]
) {
  const activeRecurring = await prisma.recurringSignup.findMany({ where: { active: true } });
  if (activeRecurring.length === 0) return;

  const byTemplate = new Map<string, typeof activeRecurring>();
  for (const r of activeRecurring) {
    if (!byTemplate.has(r.templateId)) byTemplate.set(r.templateId, []);
    byTemplate.get(r.templateId)!.push(r);
  }

  for (const template of templates) {
    const recurringForTemplate = byTemplate.get(template.id);
    if (!recurringForTemplate || recurringForTemplate.length === 0) continue;

    const date = addDays(weekStart, offsetFromMonday(template.dayOfWeek));
    const session = await prisma.clinicSession.findUnique({
      where: { templateId_date: { templateId: template.id, date } },
      include: { template: true, signups: true },
    });
    if (!session || session.status === "CANCELLED") continue;

    let activeCount = session.signups.filter((s) => !s.waitlisted && !s.cancelledAt).length;

    for (const r of recurringForTemplate) {
      // Skip if this recurring subscription already created a signup here,
      // or if the same kid/parent already has one from signing up directly
      // for this specific week (e.g. the same week they checked the
      // recurring box) — either way, they already have their spot.
      const alreadyHasSpot = session.signups.some(
        (s) =>
          s.recurringSignupId === r.id ||
          (samePhone(s.parentPhone, r.parentPhone) && s.kidName.trim().toLowerCase() === r.kidName.trim().toLowerCase())
      );
      if (alreadyHasSpot) continue;

      const waitlisted = activeCount >= session.capacity;
      await prisma.signup.create({
        data: {
          sessionId: session.id,
          recurringSignupId: r.id,
          parentName: r.parentName,
          parentPhone: r.parentPhone,
          parentEmail: r.parentEmail,
          kidName: r.kidName,
          memberNumber: r.memberNumber,
          kidAge: r.kidAge,
          waitlisted,
        },
      });
      if (!waitlisted) activeCount++;

      const dateLabel = formatDateLong(session.date);
      const timeLabel = `${formatTime(session.template.startTime)}-${formatTime(session.template.endTime)}`;
      const smsBody = waitlisted
        ? `${clubName} Tennis: ${r.kidName} added to the WAITLIST for ${session.template.name} on ${dateLabel} (${timeLabel}) — your weekly sign-up, clinic is full.`
        : `${clubName} Tennis: ${r.kidName} auto-enrolled for ${session.template.name} on ${dateLabel} (${timeLabel}) — your weekly sign-up. Manage or cancel it anytime on the site.`;
      await sendSms(toE164(r.parentPhone), smsBody);
    }
  }
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
        minSignups: template.minSignups,
      },
    });
  }

  await syncRecurringSignupsForWeek(weekStart, effectiveTemplates);

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
