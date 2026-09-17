import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ensureAndGetWeekSessions,
  addDays,
  formatDateLong,
  formatWeekParam,
  parseWeekParam,
  mondayOf,
  todayUTC,
} from "@/lib/weeks";
import SignupCard from "./SignupCard";
import LookupPanel from "./LookupPanel";

export const dynamic = "force-dynamic";

export default async function WeekPage({ params }: { params: Promise<{ weekStart: string }> }) {
  const { weekStart: weekStartParam } = await params;
  let weekStart: Date;
  try {
    weekStart = parseWeekParam(weekStartParam);
  } catch {
    notFound();
  }

  const sessions = await ensureAndGetWeekSessions(weekStart);
  const prevWeek = formatWeekParam(addDays(weekStart, -7));
  const nextWeek = formatWeekParam(addDays(weekStart, 7));
  const isCurrentWeek = weekStart.getTime() === mondayOf(todayUTC()).getTime();
  const todayKey = todayUTC().toISOString();

  const byDate = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = s.date.toISOString();
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(s);
  }

  return (
    <div>
      <p className="mb-5 text-center font-display text-base italic text-court-green/80 sm:text-lg">
        Weekly clinics for every age, all season long.
      </p>

      <div className="mb-6 flex items-center justify-between gap-2">
        <Link
          href={`/week/${prevWeek}`}
          className="flex items-center gap-1 rounded-full border border-court-navy/15 bg-white px-3 py-1.5 text-sm font-medium text-court-navy shadow-sm transition hover:border-court-green/40 hover:text-court-green sm:px-4"
        >
          <span aria-hidden>←</span> <span className="hidden sm:inline">Previous week</span>
        </Link>
        <div className="text-center">
          <h1 className="font-display text-xl font-semibold tracking-tight text-court-navy sm:text-2xl">
            Week of {formatDateLong(weekStart)}
          </h1>
          {isCurrentWeek && (
            <span className="mt-1 inline-block rounded-full bg-court-gold px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              This week
            </span>
          )}
        </div>
        <Link
          href={`/week/${nextWeek}`}
          className="flex items-center gap-1 rounded-full border border-court-navy/15 bg-white px-3 py-1.5 text-sm font-medium text-court-navy shadow-sm transition hover:border-court-green/40 hover:text-court-green sm:px-4"
        >
          <span className="hidden sm:inline">Next week</span> <span aria-hidden>→</span>
        </Link>
      </div>

      <LookupPanel />

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-court-navy/20 bg-white/60 py-10 text-center text-court-navy/50">
          No clinics are configured yet. A coach needs to run the setup/seed step.
        </p>
      ) : (
        <div className="space-y-8">
          {Array.from(byDate.entries()).map(([dateKey, daySessions]) => (
            <section key={dateKey}>
              <div className="mb-3 flex items-center gap-3">
                <h2
                  className={`font-display text-base font-semibold tracking-wide ${
                    dateKey === todayKey ? "text-court-green" : "text-court-navy/70"
                  }`}
                >
                  {formatDateLong(new Date(dateKey))}
                  {dateKey === todayKey && <span className="ml-2 text-court-gold">●</span>}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-court-navy/15 to-transparent" />
              </div>
              <div className="space-y-3">
                {daySessions.map((session) => (
                  <SignupCard
                    key={session.id}
                    session={{
                      ...session,
                      date: session.date.toISOString(),
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
