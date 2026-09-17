import { prisma } from "@/lib/prisma";
import { samePhone } from "@/lib/phone";

// Creates a standing weekly sign-up for this kid/clinic if one doesn't
// already exist (matched by phone + kid name, case-insensitive), so
// submitting the sign-up form twice with the box checked doesn't create
// duplicate recurring rows. Shared by the public sign-up route and the
// coach's walk-in route.
export async function ensureRecurringSignup(params: {
  templateId: string;
  parentId?: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail?: string | null;
  kidName: string;
  kidAge: number;
  memberNumber?: string | null;
  isNonMember?: boolean;
}): Promise<boolean> {
  const existingActive = await prisma.recurringSignup.findMany({
    where: { templateId: params.templateId, active: true },
  });
  const alreadyRecurring = existingActive.some(
    (r) =>
      samePhone(r.parentPhone, params.parentPhone) &&
      r.kidName.trim().toLowerCase() === params.kidName.trim().toLowerCase()
  );
  if (alreadyRecurring) return false;

  await prisma.recurringSignup.create({
    data: {
      templateId: params.templateId,
      parentId: params.parentId || null,
      parentName: params.parentName.trim(),
      parentPhone: params.parentPhone.trim(),
      parentEmail: params.parentEmail?.trim() || null,
      kidName: params.kidName.trim(),
      memberNumber: params.isNonMember ? null : params.memberNumber?.trim() || null,
      isNonMember: Boolean(params.isNonMember),
      kidAge: params.kidAge,
    },
  });
  return true;
}
