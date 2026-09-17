import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Loads the logged-in parent's full DB row (not just the JWT's cached
// name/id) so callers always see current phone/name/email. Returns null if
// no session, or if the session belongs to a coach instead.
export async function getCurrentParent() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "parent") return null;

  return prisma.parent.findUnique({ where: { id: user.id } });
}
