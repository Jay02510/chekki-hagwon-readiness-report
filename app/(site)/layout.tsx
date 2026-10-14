import { LangProvider } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";
import ThemeToggle from "@/components/ThemeToggle";

// The quiz/report pages share this single reading column. /admin lives
// outside this route group so its dashboard gets the full width.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-4">
        <header className="mb-8 flex items-center justify-between gap-2">
          <a href="https://chekkiai.com" className="text-[18px] font-extrabold tracking-[-0.02em]">
            Chekki<span className="text-line-ink">ai</span>
          </a>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LangToggle />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </LangProvider>
  );
}
