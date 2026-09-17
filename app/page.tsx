import { redirect } from "next/navigation";
import { formatWeekParam, mondayOf, todayUTC } from "@/lib/weeks";

export default function HomePage() {
  const weekStart = formatWeekParam(mondayOf(todayUTC()));
  redirect(`/week/${weekStart}`);
}
