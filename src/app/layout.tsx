import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export async function generateMetadata(): Promise<Metadata> {
  return {
    // Из этого адреса строятся полные ссылки в превью для мессенджеров и соцсетей.
    metadataBase: new URL(await siteUrl()),
    title: { default: `${SITE_NAME} — недвижимость на Северном Кипре`, template: `%s · ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    openGraph: { type: "website", siteName: SITE_NAME, locale: "ru_RU" },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
