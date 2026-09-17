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
          green: "#1f6f43",
          clay: "#c1622c",
          navy: "#0f2f4c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
