import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages, isRtl } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "Energy Localization Platform",
  description: "Saudi energy-sector localization intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const m = getMessages(locale);
  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body>
        <a className="sr-only focus:not-sr-only" href="#main">{m.common.welcome}</a>
        <div id="main">{children}</div>
      </body>
    </html>
  );
}
