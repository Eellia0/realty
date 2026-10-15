import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteUrl } from "@/lib/site-url";
import { getI18n } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export async function generateMetadata(): Promise<Metadata> {
  const { t, lp } = await getI18n();
  // Картинка-превью на языке страницы: /og или /en/og.
  const ogImage = { url: lp("/og"), width: 1200, height: 630, alt: t.meta.ogSiteAlt };
  return {
    // Из этого адреса строятся полные ссылки в превью для мессенджеров и соцсетей.
    metadataBase: new URL(await siteUrl()),
    title: { default: t.meta.siteTitle, template: t.meta.titleTemplate },
    description: t.meta.description,
    openGraph: { type: "website", siteName: t.meta.siteName, locale: t.meta.ogLocale, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} className={manrope.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <I18nProvider locale={locale} t={t}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
