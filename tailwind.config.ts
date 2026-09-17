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
          green: "#707c4e",
          greenDark: "#535c3a",
          greenLight: "#eef1da",
          navy: "#221f1a",
          navyLight: "#3d392f",
          clay: "#b5652f",
          clayLight: "#faf1e6",
          ball: "#dce6a8",
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
        "court-gradient": "linear-gradient(135deg, #2b271f 0%, #221f1a 55%, #1a1712 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
