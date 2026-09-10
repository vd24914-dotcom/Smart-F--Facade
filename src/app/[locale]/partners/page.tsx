import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import LogoGrid from "@/components/LogoGrid";
import CallToAction from "@/components/CallToAction";
import { isLocale, locales } from "@/i18n/config";
import { getDict, getSite, getPartners } from "@/content/store";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata("partners", isLocale(locale) ? locale : "ru");
}

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDict(locale);
  const site = await getSite();
  const { representatives, partners } = await getPartners();

  return (
    <>
      <PageHero title={dict.pages.partners.heading} image={site.images.pageHero} />
      <LogoGrid title={dict.representatives.title} logos={representatives} />
      <LogoGrid title={dict.partners.title} logos={partners} />
      <CallToAction dict={dict} image={site.images.cta} site={site} />
    </>
  );
}
