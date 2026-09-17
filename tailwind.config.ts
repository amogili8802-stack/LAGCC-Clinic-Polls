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
          green: "#1e7a4f",
          greenDark: "#155c3b",
          greenLight: "#e7f5ec",
          navy: "#0f2744",
          navyLight: "#1c3f66",
          clay: "#c1622c",
          clayLight: "#fdf1e9",
          ball: "#d4f36a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 39, 68, 0.06), 0 8px 24px -12px rgba(15, 39, 68, 0.18)",
        cardHover: "0 4px 10px rgba(15, 39, 68, 0.08), 0 16px 32px -14px rgba(15, 39, 68, 0.24)",
      },
      backgroundImage: {
        "court-gradient": "linear-gradient(135deg, #123354 0%, #0f2744 55%, #0c1f38 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
