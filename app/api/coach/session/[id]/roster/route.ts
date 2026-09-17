import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/weeks";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await prisma.clinicSession.findUnique({
    where: { id },
    include: { template: true, signups: { orderBy: [{ waitlisted: "asc" }, { createdAt: "asc" }] } },
  });
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  // Early (24h+ notice) cancellations are dropped entirely; late
  // cancellations (billable, per club policy) stay on the roster so the
  // CSV can be used for billing paperwork.
  const rows = [
    ["Child", "Member #", "Age", "Parent", "Phone", "Email", "Status"],
    ...session.signups
      .filter((s) => !s.cancelledAt || s.lateCancellation)
      .map((s) => [
        s.kidName,
        s.memberNumber || "",
        String(s.kidAge),
        s.parentName,
        s.parentPhone,
        s.parentEmail || "",
        s.cancelledAt ? "Cancelled (late — still billed)" : s.waitlisted ? "Waitlist" : "Confirmed",
      ]),
  ];
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");

  const filename = `${session.template.name.replace(/\s+/g, "-")}-${formatDateShort(session.date).replace(/\s+/g, "-")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
