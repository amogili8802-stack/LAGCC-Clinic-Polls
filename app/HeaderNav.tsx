"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function HeaderNav({ isCoach }: { isCoach: boolean }) {
  if (isCoach) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border border-court-navy/20 px-4 py-1.5 font-medium text-court-navy/80 transition hover:border-court-navy/40 hover:bg-court-navy/5 hover:text-court-navy"
      >
        Sign out
      </button>
    );
  }

  return (
    <Link href="/coach/login" className="px-1 py-1.5 text-court-navy/40 transition hover:text-court-navy/70">
      Coach
    </Link>
  );
}
