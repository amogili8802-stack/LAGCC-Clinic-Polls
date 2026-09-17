import { NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/parentAuth";
import { getParentAccountView } from "@/lib/parentAccount";

export async function GET() {
  const parent = await getCurrentParent();
  if (!parent) return NextResponse.json({ error: "Log in to view your sign-ups." }, { status: 401 });

  const view = await getParentAccountView(parent.id);
  return NextResponse.json({
    parent: { name: parent.name, phone: parent.phone, email: parent.email },
    ...view,
  });
}
