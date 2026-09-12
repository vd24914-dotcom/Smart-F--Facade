import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import AboutSplit from "@/components/ui/about-split";
import FeatureGrid from "@/components/ui/feature-grid";
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
  return pageMetadata("about", isLocale(locale) ? locale : "ru");
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDict(locale);
  const site = await getSite();
  const { partners } = await getPartners();
  const page = dict.pages.about;

  return (
    <>
      <PageHero title={page.heading} image={site.images.pageHero} />

      <AboutSplit
        eyebrow={dict.nav.about}
        title={page.subtitle}
        text={page.text}
        image={site.images.aboutCompany}
        action={{ label: dict.cta.button, href: `/${locale}/contacts` }}
      />

      <FeatureGrid
        title={page.advantagesTitle}
        description={page.advantagesLead}
        items={page.advantages.map((item, index) => ({ ...item, icon: site.icons.advantages[index] }))}
        highlight={dict.group?.stats?.[1] ?? dict.group?.stats?.[0]}
      />

      <LogoGrid title={dict.partners.title} logos={partners} />
      <CallToAction dict={dict} image={site.images.cta} site={site} />
    </>
  );
}
