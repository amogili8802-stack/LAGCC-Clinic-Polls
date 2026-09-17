import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";

const clubName = process.env.CLUB_NAME || "LAGCC";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: `${clubName} Tennis Clinics`,
  description: `Sign up for weekly tennis clinics at ${clubName}`,
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8E%BE%3C/text%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <header className="bg-court-gradient text-white shadow-md">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-court-ball text-lg shadow-sm">
                  🎾
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-base font-bold tracking-tight sm:text-lg">{clubName}</span>
                  <span className="text-[11px] font-medium uppercase tracking-widest text-white/60">
                    Tennis Clinics
                  </span>
                </span>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/coach/login"
                  className="rounded-full border border-white/25 px-4 py-1.5 font-medium text-white/90 transition hover:border-white/50 hover:bg-white/10 hover:text-white"
                >
                  Coach Login
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200/70 py-8 text-center text-xs text-slate-400">
            Questions about a clinic? Contact the pro shop.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
