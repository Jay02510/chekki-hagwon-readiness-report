import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Hagwon AI Readiness Index",
  description: "A short assessment of where your hagwon stands today.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-body min-h-screen">
        <main className="max-w-xl mx-auto px-6 py-16">{children}</main>
      </body>
    </html>
  );
}
