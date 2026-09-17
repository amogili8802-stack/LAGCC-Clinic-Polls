import { NextRequest, NextResponse } from "next/server";
import { getCoachSession } from "@/lib/coachAuth";
import { cancelSessionAndNotify, VALID_CANCELLATION_REASONS } from "@/lib/cancelSession";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await getCoachSession();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const reason = body?.reason as string | undefined;
  const note = (body?.note as string | undefined)?.trim() || null;

  if (!reason || !VALID_CANCELLATION_REASONS.has(reason)) {
    return NextResponse.json({ error: "Invalid cancellation reason." }, { status: 400 });
  }

  const result = await cancelSessionAndNotify({
    sessionId: id,
    reason,
    note,
    cancelledBy: authSession.user?.email || authSession.user?.name || "a coach",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === "Session not found." ? 404 : 400 });
  }

  return NextResponse.json({ success: true, textsSent: result.textsSent });
}
