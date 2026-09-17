import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";

const clubName = process.env.CLUB_NAME || "LAGCC";

export const metadata: Metadata = {
  title: `${clubName} Tennis Clinics`,
  description: `Sign up for weekly tennis clinics at ${clubName}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
        <header className="bg-court-navy text-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              🎾 {clubName} Tennis Clinics
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/coach/login" className="text-white/80 hover:text-white">
                Coach Login
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[80vh] max-w-4xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 py-8 text-center text-xs text-slate-400">
          Questions about a clinic? Contact the pro shop.
        </footer>
        </Providers>
      </body>
    </html>
  );
}
