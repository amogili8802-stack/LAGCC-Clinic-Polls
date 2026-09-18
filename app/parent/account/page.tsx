import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/parentAuth";
import { getParentAccountView } from "@/lib/parentAccount";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function ParentAccountPage() {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login?next=/parent/account");

  const view = await getParentAccountView(parent.id);

  return (
    <AccountClient
      parentName={parent.name}
      parentPhone={parent.phone}
      upcoming={view.upcoming}
      recurring={view.recurring}
      lateCancellations={view.lateCancellations}
      history={view.history}
    />
  );
}
