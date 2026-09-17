// Pure date/timezone helpers with zero server-only dependencies (no
// prisma, no sms) — safe to import from "use client" components. Anything
// that touches the database or sends texts lives in lib/weeks.ts instead,
// which re-exports everything from here so existing server-side imports
// from "@/lib/weeks" keep working unchanged.

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

// The club's local timezone, used only for the "next week opens Thursday
// 10am" release gate below — everything else in this file is deliberately
// timezone-agnostic date-only math.
export const CLUB_TIMEZONE = process.env.CLUB_TIMEZONE || "America/Los_Angeles";

// Converts a Y/M/D + hour/minute wall-clock time *in timeZone* to the
// corresponding UTC instant, correctly accounting for that zone's DST
// offset on that specific date. Two passes is enough to converge except
// in the one-hour DST-transition window itself, which is an acceptable
// edge case for a "opens around 10am" release gate.
function zonedWallTimeToUTC(
  y: number,
  m: number,
  d: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  // How far "instant" is behind the timeZone's wall-clock reading of it,
  // in ms, when both are expressed as UTC-millis.
  const offsetAt = (instantMs: number) => {
    const parts = dtf.formatToParts(new Date(instantMs)).reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
    const asIfUTC = Date.UTC(
      parseInt(parts.year, 10),
      parseInt(parts.month, 10) - 1,
      parseInt(parts.day, 10),
      parseInt(parts.hour, 10),
      parseInt(parts.minute, 10),
      parseInt(parts.second, 10)
    );
    return asIfUTC - instantMs;
  };

  const naive = Date.UTC(y, m, d, hour, minute, 0);
  const offset = offsetAt(naive);
  let utc = naive - offset;
  // Re-check once in case the offset changed between `naive` and `utc`
  // (i.e. the desired wall-clock time falls right at a DST transition).
  const offset2 = offsetAt(utc);
  if (offset2 !== offset) utc = naive - offset2;
  return new Date(utc);
}

// A week (identified by its Monday) opens for public sign-ups at 10:00am
// club-local time on the Thursday of the *previous* week — i.e. 4 days
// before that Monday.
export function weekOpensAt(weekStart: Date): Date {
  const thursdayBefore = addDays(weekStart, -4);
  return zonedWallTimeToUTC(
    thursdayBefore.getUTCFullYear(),
    thursdayBefore.getUTCMonth(),
    thursdayBefore.getUTCDate(),
    10,
    0,
    CLUB_TIMEZONE
  );
}

export function isWeekOpenForSignup(weekStart: Date, now: Date = new Date()): boolean {
  return now.getTime() >= weekOpensAt(weekStart).getTime();
}

export function formatOpensAt(weekStart: Date): string {
  return weekOpensAt(weekStart).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: CLUB_TIMEZONE,
    timeZoneName: "short",
  });
}

// New sign-ups for a given clinic session close at 8:00pm club-local time
// the night before it runs. This is independent of the auto-cancellation
// cron (which fires around the same time to cancel under-minimum
// sessions) — a session that already has enough sign-ups by 8pm simply
// stops accepting more, without being cancelled.
export function signupCutoffFor(sessionDate: Date): Date {
  const nightBefore = addDays(sessionDate, -1);
  return zonedWallTimeToUTC(
    nightBefore.getUTCFullYear(),
    nightBefore.getUTCMonth(),
    nightBefore.getUTCDate(),
    20,
    0,
    CLUB_TIMEZONE
  );
}

export function isSignupOpenForSession(sessionDate: Date, now: Date = new Date()): boolean {
  return now.getTime() < signupCutoffFor(sessionDate).getTime();
}

export function formatSignupCutoff(sessionDate: Date): string {
  return signupCutoffFor(sessionDate).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: CLUB_TIMEZONE,
    timeZoneName: "short",
  });
}

// Day-of-week offset from Monday (0) used to place each template within a
// week that starts on Monday, even though ClinicTemplate.dayOfWeek uses the
// JS convention (0 = Sunday).
export function offsetFromMonday(dayOfWeek: number): number {
  return (dayOfWeek + 6) % 7;
}

// The actual club-local moment a clinic starts, combining its calendar date
// with its "HH:MM" start time — distinct from signupCutoffFor, which is a
// fixed 8pm-the-night-before regardless of what time the clinic itself runs.
export function sessionStartAt(sessionDate: Date, startTime: string): Date {
  const [hourStr, minuteStr] = startTime.split(":");
  return zonedWallTimeToUTC(
    sessionDate.getUTCFullYear(),
    sessionDate.getUTCMonth(),
    sessionDate.getUTCDate(),
    parseInt(hourStr, 10),
    parseInt(minuteStr, 10),
    CLUB_TIMEZONE
  );
}

// Club policy: cancelling within 24 hours of the clinic's actual start
// time still incurs a charge. Coaches see these flagged on the roster.
export function isLateCancellation(sessionDate: Date, startTime: string, now: Date = new Date()): boolean {
  const start = sessionStartAt(sessionDate, startTime);
  return now.getTime() > start.getTime() - 24 * 60 * 60 * 1000;
}
