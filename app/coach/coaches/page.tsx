import { redirect } from "next/navigation";
import { getCoachSession } from "@/lib/coachAuth";
import { prisma } from "@/lib/prisma";
import CoachesClient from "./CoachesClient";

export const dynamic = "force-dynamic";

export default async function CoachesPage() {
  const authSession = await getCoachSession();
  if (!authSession) redirect("/coach/login");

  const coaches = await prisma.coach.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  return (
    <CoachesClient
      coaches={coaches.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
      currentCoachEmail={authSession.user?.email || ""}
    />
  );
}
