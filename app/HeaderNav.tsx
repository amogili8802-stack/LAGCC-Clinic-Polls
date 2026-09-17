"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function HeaderNav({
  parentName,
  isCoach,
}: {
  parentName: string | null;
  isCoach: boolean;
}) {
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

  if (parentName) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/parent/account"
          className="rounded-full border border-court-navy/20 px-4 py-1.5 font-medium text-court-navy/80 transition hover:border-court-navy/40 hover:bg-court-navy/5 hover:text-court-navy"
        >
          {parentName.split(" ")[0]}'s Account
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-court-navy/40 transition hover:text-court-navy/70"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/parent/login"
        className="rounded-full border border-court-navy/20 px-4 py-1.5 font-medium text-court-navy/80 transition hover:border-court-navy/40 hover:bg-court-navy/5 hover:text-court-navy"
      >
        Log In
      </Link>
      <Link
        href="/coach/login"
        className="text-court-navy/40 transition hover:text-court-navy/70"
      >
        Coach
      </Link>
    </div>
  );
}
