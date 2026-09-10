import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDict, getSite, getSeo } from "@/content/store";
import { pageMetadata } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactModal from "@/components/ContactModal";
import StatsBeacon from "@/components/StatsBeacon";
import Analytics from "@/components/Analytics";
import SplashScreen from "@/components/SplashScreen";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Общие метатеги языка: страницы поверх ставят свои заголовки. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata("home", isLocale(locale) ? locale : "ru");
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDict(locale);
  const site = getSite();
  const { analytics } = getSeo();

  return (
    <>
      <SplashScreen logo={site.images.logoHeader} />
      <Header locale={locale} dict={dict} logo={site.images.logoHeader} />
      <main>{children}</main>
      <Footer dict={dict} locale={locale} site={site} />
      <ContactModal dict={dict} site={site} />
      <StatsBeacon />
      <Analytics googleId={analytics.googleId} yandexId={analytics.yandexId} />
    </>
  );
}
