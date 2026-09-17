import { notFound, redirect } from "next/navigation";
import { getCoachSession } from "@/lib/coachAuth";
import { ensureAndGetWeekSessions, addDays, formatDateLong, formatWeekParam, parseWeekParam } from "@/lib/weeks";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function CoachWeekDashboard({ params }: { params: Promise<{ weekStart: string }> }) {
  const authSession = await getCoachSession();
  if (!authSession) redirect("/coach/login");
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

  return (
    <DashboardClient
      coachName={authSession?.user?.name || authSession?.user?.email || "Coach"}
      weekLabel={formatDateLong(weekStart)}
      prevWeekHref={`/coach/dashboard/${prevWeek}`}
      nextWeekHref={`/coach/dashboard/${nextWeek}`}
      sessions={sessions.map((s) => ({
        ...s,
        date: s.date.toISOString(),
        signups: s.signups.map((sg) => ({
          ...sg,
          createdAt: sg.createdAt.toISOString(),
          cancelledAt: sg.cancelledAt ? sg.cancelledAt.toISOString() : null,
        })),
      }))}
    />
  );
}
