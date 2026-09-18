import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import AboutSplit from "@/components/ui/about-split";
import FeatureGrid from "@/components/ui/feature-grid";
import CoverflowCarousel from "@/components/ui/coverflow-carousel";
import DocList from "@/components/ui/doc-list";
import ProcessSteps from "@/components/ProcessSteps";
import GroupExperience from "@/components/GroupExperience";
import BentoGallery from "@/components/ui/bento-gallery";
import LogoGrid from "@/components/LogoGrid";
import CinematicLogoCloud from "@/components/ui/cinematic-logo-cloud";
import CallToAction from "@/components/CallToAction";
import { isLocale } from "@/i18n/config";
import { getDict, getSite, getProjects, getPartners } from "@/content/store";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata("home", isLocale(locale) ? locale : "ru");
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDict(locale);
  const site = await getSite();
  const projects = await getProjects();
  const { representatives, partners, showOnHome: showPartners } = await getPartners();

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

        {/* Материалы — главный блок для рынка Узбекистана: карусель, по клику окно с описанием */}
        <CoverflowCarousel
          id="materials"
          title={dict.materials?.title}
          description={dict.materials?.lead}
          moreLabel={dict.materials?.more || "Подробнее"}
          ctaLabel={dict.calc.button}
          items={(dict.materials?.items ?? []).map((item, index) => ({
            ...item,
            img: site.icons.materials[index],
          }))}
        />

        <ProcessSteps dict={dict} icons={site.icons.process} />

        <GroupExperience dict={dict} photos={site.group.photos} />

        {/* Партнёры: блок включается переключателем в админке, раздел «Партнёры» */}
        {showPartners && (
          <CinematicLogoCloud
            id="partners"
            title={dict.partners.title}
            description={dict.partners.lead}
            logos={partners}
          />
        )}

        <FeatureGrid
          tone="white"
          title={dict.pages.about.advantagesTitle}
          description={dict.pages.about.advantagesLead}
          items={dict.pages.about.advantages.map((item, index) => ({
            ...item,
            icon: site.icons.advantages[index],
          }))}
        />

        <FeatureGrid
          id="docs"
          allowPhoto
          title={dict.docs?.title}
          description={dict.docs?.lead}
          fileLabel={dict.docs?.open}
          items={(dict.docs?.items ?? []).map((item, index) => ({
            ...item,
            icon: site.icons.docs[index],
            file: site.files?.docs?.[index] ?? "",
          }))}
          footer={
            <DocList
              title={dict.docs?.filesTitle ?? ""}
              downloadLabel={dict.docs?.download ?? ""}
              items={(dict.docs?.files ?? []).map((item, index) => ({
                ...item,
                file: site.files?.library?.[index] ?? "",
              }))}
            />
          }
        />

        {/* объекты появятся после съёмки в Ташкенте — пустой раздел не показываем */}
        {projects.length > 0 && (
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
        )}

        <LogoGrid title={dict.representatives.title} logos={representatives} />

        <CallToAction dict={dict} image={site.images.cta} site={site} />
      </div>
    </>
  );
}
