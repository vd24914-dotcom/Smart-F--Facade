import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import AboutSplit from "@/components/ui/about-split";
import FeatureGrid from "@/components/ui/feature-grid";
import Services from "@/components/Services";
import BentoGallery from "@/components/ui/bento-gallery";
import LogoGrid from "@/components/LogoGrid";
import CallToAction from "@/components/CallToAction";
import BeforeAfter from "@/components/BeforeAfter";
import { isLocale } from "@/i18n/config";
import { getDict, getSite, getProjects, getPartners, getBeforeAfter } from "@/content/store";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata("home", isLocale(locale) ? locale : "ru");
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDict(locale);
  const site = getSite();
  const projects = getProjects();
  const { representatives, partners } = getPartners();
  const { items: beforeAfter } = getBeforeAfter();

  return (
    <>
      <Hero dict={dict} locale={locale} site={site} />

      {/* контент поднимается поверх первого экрана, стык — мягкая растушёвка */}
      <div className="relative z-10">
        <div aria-hidden className="h-28 bg-gradient-to-b from-transparent to-white dark:to-[#0b1523] lg:h-36" />
        <AboutSplit
        eyebrow={dict.about.title}
        title={dict.about.subtitle}
        text={dict.about.text}
        image={site.images.aboutPhoto}
        imageSide="right"
        chips={site.icons.specs.map((icon, index) => ({ icon, label: dict.about.specs[index] ?? "" }))}
        action={{ label: dict.about.more, href: `/${locale}/about` }}
      />

      <FeatureGrid
        title={dict.pages.about.advantagesTitle}
        description={dict.pages.about.advantagesLead}
        items={dict.pages.about.advantages.map((item, index) => ({
          ...item,
          icon: site.icons.advantages[index],
        }))}
        highlight={dict.stats[0] ? { value: dict.stats[0].value, label: dict.stats[0].label } : undefined}
      />
      <Services dict={dict} icons={site.icons.services} />
      <BentoGallery
        title={dict.projects.title}
        description={dict.projects.lead}
        action={{ label: dict.projects.all, href: `/${locale}/projects` }}
        openLabel={dict.pages.projects.open}
        items={projects.slice(0, 7).map((project, index) => ({
          id: project.id,
          title: project.texts[locale].title,
          desc: project.texts[locale].description || project.texts[locale].material,
          url: project.image,
          href: `/${locale}/projects/${project.id}`,
          span: index % 3 === 0 ? "md:row-span-2" : "md:row-span-1",
        }))}
      />
      <LogoGrid title={dict.representatives.title} logos={representatives} />
      <LogoGrid title={dict.partners.title} logos={partners} />
        <BeforeAfter
          items={beforeAfter}
          locale={locale}
          title={dict.beforeAfter.title}
          lead={dict.beforeAfter.lead}
          beforeLabel={dict.beforeAfter.before}
          afterLabel={dict.beforeAfter.after}
        />

        <CallToAction dict={dict} image={site.images.cta} site={site} />
      </div>
    </>
  );
}
