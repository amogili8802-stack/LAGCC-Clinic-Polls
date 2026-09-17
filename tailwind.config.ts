import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        court: {
          green: "#4a5a2f",
          greenDark: "#333f1f",
          greenLight: "#dbe3c4",
          navy: "#1a1712",
          navyLight: "#332e22",
          clay: "#a8501f",
          clayLight: "#faf1e6",
          gold: "#a67c2e",
          goldLight: "#f1e6c8",
          cream: "#f7f4ec",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(34, 31, 26, 0.05), 0 8px 24px -12px rgba(34, 31, 26, 0.16)",
        cardHover: "0 6px 14px rgba(34, 31, 26, 0.08), 0 20px 36px -14px rgba(34, 31, 26, 0.22)",
      },
      backgroundImage: {
        "court-gradient": "linear-gradient(135deg, #221f17 0%, #1a1712 55%, #120f0b 100%)",
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
