import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Beau_Rivage } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";

const clubName = process.env.CLUB_NAME || "LAGCC";
const faviconLetter = (clubName.trim().charAt(0) || "T").toUpperCase();
const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='#221f1a'/><text x='32' y='43' font-family='Georgia, serif' font-size='30' fill='#dce6a8' text-anchor='middle'>${faviconLetter}</text></svg>`;

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

export const metadata: Metadata = {
  title: `${clubName} Tennis Clinics`,
  description: `Sign up for weekly tennis clinics at ${clubName}`,
  icons: {
    icon: `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${script.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <header className="border-b border-black/10 bg-court-cream/95 backdrop-blur">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-baseline gap-3">
                <span className="font-script text-4xl leading-none text-court-navy sm:text-5xl">
                  {clubName}
                </span>
                <span className="hidden font-serif text-[11px] uppercase tracking-[0.3em] text-court-green sm:inline">
                  Tennis Clinics
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
          <footer className="border-t border-black/10 py-8 text-center text-xs text-court-navy/40">
            Questions about a clinic? Contact the pro shop.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
