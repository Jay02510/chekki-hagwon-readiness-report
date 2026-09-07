import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Matches chekki-ai's locked palette (.tastemaker/style-lock.md) —
        // dark mode default, one accent (orange), nothing invented here.
        "brand-dark": "#050505",
        "brand-card": "#0f1014",
        "brand-orange": "#f97316",
        "text-main": "#f4f4f5",
        "text-muted": "#a1a1aa",
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "sans-serif"],
        body: ["var(--font-onest)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
