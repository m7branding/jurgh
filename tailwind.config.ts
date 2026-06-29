import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Themeable surfaces/tekst via CSS-variabelen (RGB-kanalen).
        jurgh: {
          black: "rgb(var(--bg) / <alpha-value>)",
          panel: "rgb(var(--panel) / <alpha-value>)",
          card: "rgb(var(--surface) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
          muted: "rgb(var(--muted) / <alpha-value>)",
          text: "rgb(var(--text) / <alpha-value>)",
          // Vaste accentkleuren in beide thema's
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
        glow: "0 0 0 1px rgba(225,29,42,0.4), 0 8px 30px -10px rgba(225,29,42,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
