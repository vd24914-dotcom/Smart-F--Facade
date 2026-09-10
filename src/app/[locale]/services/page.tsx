import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import Services from "@/components/Services";
import Stats from "@/components/Stats";
import CallToAction from "@/components/CallToAction";
import { isLocale, locales } from "@/i18n/config";
import { getDict, getSite } from "@/content/store";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata("services", isLocale(locale) ? locale : "ru");
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDict(locale);
  const site = await getSite();

  return (
    <>
      <PageHero title={dict.pages.services.heading} image={site.images.pageHero} />

      <section className="bg-white pt-14">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className="max-w-[800px] text-[16px] font-light leading-[28px] text-graphite lg:text-[18px]">
            {dict.pages.services.intro}
          </p>
        </div>
      </section>

      <Services dict={dict} icons={site.icons.services} />
      <Stats dict={dict} />
      <CallToAction dict={dict} image={site.images.cta} site={site} />
    </>
  );
}
