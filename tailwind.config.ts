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
      },
      boxShadow: {
        card: "0 1px 2px rgba(34, 31, 26, 0.05), 0 8px 24px -12px rgba(34, 31, 26, 0.16)",
        cardHover: "0 4px 10px rgba(34, 31, 26, 0.07), 0 16px 32px -14px rgba(34, 31, 26, 0.2)",
      },
      backgroundImage: {
        "court-gradient": "linear-gradient(135deg, #221f17 0%, #1a1712 55%, #120f0b 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
