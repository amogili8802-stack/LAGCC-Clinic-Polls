"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

const pillClass =
  "rounded-full border border-court-navy/20 px-4 py-1.5 font-medium text-court-navy/80 transition hover:border-court-navy/40 hover:bg-court-navy/5 hover:text-court-navy";
const ghostClass = "px-1 py-1.5 text-court-navy/40 transition hover:text-court-navy/70";

export default function HeaderNav({
  parentName,
  isCoach,
}: {
  parentName: string | null;
  isCoach: boolean;
}) {
  if (isCoach) {
    return (
      <button onClick={() => signOut({ callbackUrl: "/" })} className={pillClass}>
        Sign out
      </button>
    );
  }

  if (parentName) {
    const initial = parentName.trim().charAt(0).toUpperCase() || "?";
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/parent/account"
          className="group/acct inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-court-green py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-court-greenDark hover:shadow-md"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            {initial}
          </span>
          Account
          <span aria-hidden className="transition-transform group-hover/acct:translate-x-0.5">
            →
          </span>
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className={ghostClass}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/parent/login" className={pillClass}>
        Log In
      </Link>
      <Link href="/coach/login" className={ghostClass}>
        Coach
      </Link>
    </div>
  );
}
