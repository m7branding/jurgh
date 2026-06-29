import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // JURGH premium automotive palette
        jurgh: {
          black: "#0a0a0b",
          panel: "#121214",
          card: "#17171a",
          border: "#26262b",
          muted: "#8a8a93",
          red: "#e11d2a",
          redDark: "#b3121d",
          green: "#22c55e",
          gold: "#c9a14a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(225,29,42,0.4), 0 8px 30px -10px rgba(225,29,42,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
