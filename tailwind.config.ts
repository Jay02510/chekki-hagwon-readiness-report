import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // chekki-ai's warm tokens (DESIGN.md) — CSS vars in globals.css, so
      // light and dark share one set of classes.
      colors: {
        ground: "var(--m-ground)",
        surface: "var(--m-surface)",
        sunken: "var(--m-sunken)",
        sign: "var(--m-sign)",
        "on-sign": "var(--m-on-sign)",
        ink: "var(--m-ink)",
        "ink-2": "var(--m-ink-2)",
        "ink-3": "var(--m-ink-3)",
        rule: "var(--m-rule)",
        line: "var(--m-line)",
        "line-ink": "var(--m-line-ink)",
        "line-soft": "var(--m-line-soft)",
        wrong: "var(--m-wrong)",
        // `text-right` is also text-align:right, so green text is text-correct.
        correct: "var(--m-right)",
        "right-soft": "var(--m-right-soft)",
        // Text on orange stays cocoa in both themes.
        "on-line": "#2b211a",
      },
      fontFamily: {
        sans: ["'Pretendard Variable'", "Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "'Apple SD Gothic Neo'", "'Malgun Gothic'", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
        md: "14px",
        lg: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
