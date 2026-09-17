import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Same NextAuth session used for both coach and parent logins now that both
// exist, so every coach-only route/page must check the role — otherwise a
// logged-in parent's (also-valid) session would pass a bare "is there a
// session" check and reach coach-only actions.
export async function getCoachSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "coach" ? session : null;
}
