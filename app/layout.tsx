import Script from "next/script";
import { Bricolage_Grotesque, Onest } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-bricolage",
});

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-onest",
});

export const metadata = {
  title: "Hagwon AI Readiness Index",
  description: "A short assessment of where your hagwon stands today.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${onest.variable}`}>
      {GA_MEASUREMENT_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      )}
      <body className="font-body min-h-screen bg-brand-dark text-text-main">
        <main className="max-w-xl mx-auto px-6 py-16">
          <LangProvider>
            <LangToggle />
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 md:p-8">
              {children}
            </div>
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
      </body>
    </html>
  );
}
