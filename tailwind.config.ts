import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Matches chekki-ai's locked palette (.tastemaker/style-lock.md) —
        // CSS vars so dark (default) and light mode share one set of classes.
        "brand-dark": "var(--color-brand-dark)",
        "brand-card": "var(--color-brand-card)",
        "brand-orange": "var(--color-brand-orange)",
        "brand-border": "var(--color-brand-border)",
        "text-main": "var(--color-text-main)",
        "text-muted": "var(--color-text-muted)",
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
