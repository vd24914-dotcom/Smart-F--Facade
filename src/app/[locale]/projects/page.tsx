import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import PortfolioGrid from "@/components/PortfolioGrid";
import CallToAction from "@/components/CallToAction";
import { isLocale, locales } from "@/i18n/config";
import { getDict, getSite, getProjects } from "@/content/store";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata("projects", isLocale(locale) ? locale : "ru");
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDict(locale);
  const site = await getSite();

  return (
    <>
      <PageHero title={dict.pages.projects.heading} image={site.images.pageHero} />
      <PortfolioGrid dict={dict} locale={locale} projects={await getProjects()} />
      <CallToAction dict={dict} image={site.images.cta} site={site} />
    </>
  );
}
