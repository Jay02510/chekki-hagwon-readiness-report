import { LangProvider } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";

// The quiz/report pages share this narrow card shell. /admin lives outside
// this route group so its dashboard isn't squeezed into a 576px card.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <LangProvider>
        <LangToggle />
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 md:p-8">{children}</div>
        <footer className="text-center mt-10">
          <a
            href="https://chekkiai.com"
            className="font-display font-black text-sm text-text-muted hover:text-text-main transition-colors"
          >
            Chekki<span className="text-brand-orange">ai</span>
          </a>
        </footer>
      </LangProvider>
    </main>
  );
}
