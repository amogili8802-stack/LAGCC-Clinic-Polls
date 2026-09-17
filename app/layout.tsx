import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Beau_Rivage, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";

const clubName = process.env.CLUB_NAME || "LAGCC";
const faviconLetter = (clubName.trim().charAt(0) || "T").toUpperCase();
const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='#1a1712'/><text x='32' y='43' font-family='Georgia, serif' font-size='30' fill='#f7f4ec' text-anchor='middle'>${faviconLetter}</text></svg>`;

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const script = Beau_Rivage({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: `${clubName} Tennis Clinics`,
  description: `Sign up for weekly tennis clinics at ${clubName}`,
  icons: {
    icon: `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${script.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <header className="relative border-b border-court-gold/25 bg-court-cream/95 backdrop-blur">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-court-gold/60 to-transparent" />
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
              <Link href="/" className="flex items-baseline gap-3">
                <span className="font-script text-4xl leading-none text-court-navy sm:text-5xl">
                  {clubName}
                </span>
                <span className="hidden items-center gap-2 font-display text-[11px] uppercase tracking-[0.32em] text-court-green sm:flex">
                  <span className="text-court-gold">&middot;</span> Tennis Clinics
                </span>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/coach/login"
                  className="rounded-full border border-court-navy/20 px-4 py-1.5 font-medium text-court-navy/80 transition hover:border-court-navy/40 hover:bg-court-navy/5 hover:text-court-navy"
                >
                  Coach Login
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-court-navy/10 py-8 text-center text-xs text-court-navy/40">
            <span className="font-script text-lg text-court-navy/30">{clubName}</span>
            <p className="mt-1">Questions about a clinic? Contact the pro shop.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
