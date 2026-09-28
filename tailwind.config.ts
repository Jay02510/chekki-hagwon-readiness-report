import type { Config } from "tailwindcss";

const config: Config = {
  // `dark:` follows the same rule as globals.css: OS preference, overridden
  // by an explicit data-theme from ThemeToggle.
  darkMode: [
    "variant",
    [
      "@media (prefers-color-scheme: dark) { &:not(:where([data-theme=light], [data-theme=light] *)) }",
      "&:where([data-theme=dark], [data-theme=dark] *)",
    ],
  ],
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
