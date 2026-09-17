import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureAndGetWeekSessions, addDays, formatDateLong, formatWeekParam, parseWeekParam } from "@/lib/weeks";
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

  const byDate = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = s.date.toISOString();
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(s);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/week/${prevWeek}`} className="text-sm font-medium text-court-navy hover:underline">
          ← Previous week
        </Link>
        <h1 className="text-center text-xl font-bold">
          Week of {formatDateLong(weekStart)}
        </h1>
        <Link href={`/week/${nextWeek}`} className="text-sm font-medium text-court-navy hover:underline">
          Next week →
        </Link>
      </div>

      <LookupPanel />

      {sessions.length === 0 ? (
        <p className="text-center text-slate-500">
          No clinics are configured yet. A coach needs to run the setup/seed step.
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(byDate.entries()).map(([dateKey, daySessions]) => (
            <section key={dateKey}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {formatDateLong(new Date(dateKey))}
              </h2>
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
