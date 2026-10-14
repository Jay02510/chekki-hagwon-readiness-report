"use client";

import { useEffect, useState } from "react";

export const THEME_KEY = "hagwon-readiness-theme";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  // null until mounted — the resolved theme depends on localStorage / the OS,
  // which the server can't know, so render nothing theme-specific until then.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const explicit = document.documentElement.dataset.theme;
    setTheme(
      explicit === "light" || explicit === "dark"
        ? explicit
        : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
    );
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage blocked — the choice just won't persist across visits
    }
  }

  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
    >
      {theme === "light" ? (
        // moon
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // sun
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}
