import { redirect } from "next/navigation";
import { formatWeekParam, mondayOf, todayUTC } from "@/lib/weeks";

export default function CoachDashboardHome() {
  const weekStart = formatWeekParam(mondayOf(todayUTC()));
  redirect(`/coach/dashboard/${weekStart}`);
}
