import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CallToAction from "@/components/CallToAction";
import { isLocale, locales } from "@/i18n/config";
import { getDict, getSite, getProjects } from "@/content/store";
import { projectMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((locale) => getProjects().map((item) => ({ locale, slug: item.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const project = getProjects().find((p) => p.id === slug);
  if (!project) return {};
  const text = project.texts[locale];

  return projectMetadata({
    locale,
    slug,
    title: text.title,
    description: text.text.slice(0, 160),
    image: project.image,
    seoTitle: text.seoTitle,
    seoDescription: text.seoDescription,
  });
}

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const project = getProjects().find((p) => p.id === slug);
  if (!project) notFound();

  const dict = getDict(locale);
  const site = getSite();
  const text = project.texts[locale];
  const t = dict.pages.project;

  const specs = [
    { icon: "/icons/spec-material.svg", label: t.material, value: text.material },
    { icon: "/icons/spec-area.svg", label: t.area, value: text.area },
    { icon: "/icons/spec-colors.svg", label: t.colors, value: text.colors },
  ].filter((spec) => spec.value.trim().length > 0);

  return (
    <>
      <section className="bg-white px-3 pb-2 pt-24 sm:px-5 lg:pt-28">
        <div className="relative isolate mx-auto max-w-[1320px] overflow-hidden rounded-[28px] lg:rounded-[40px]">
          <Image
            src={project.image}
            alt=""
            fill
            sizes="100vw"
            priority
            className="-z-20 object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-ink/70" aria-hidden />

          <div className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
            <Link
              href={`/${locale}/projects`}
              className="text-[14px] font-semibold uppercase tracking-[1px] text-gold transition-opacity hover:opacity-80"
            >
              ← {t.back}
            </Link>
            <h1 className="mt-5 text-[28px] font-extrabold uppercase leading-[1.25] text-white lg:text-[46px]">
              {text.title}
            </h1>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 lg:py-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-5 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-[24px] font-extrabold uppercase leading-[1.25] text-black-soft lg:text-[32px]">
              {text.title}
            </h2>
            <div className="rule-gold mt-5" />
            <p className="mt-6 text-[16px] font-light leading-[28px] text-graphite lg:text-[18px]">
              {text.description || text.text}
            </p>
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden shadow-[40px_40px_120px_-40px_rgba(0,0,0,0.24)]">
            <Image
              src={project.image}
              alt={text.imageAlt?.trim() || text.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {specs.length > 0 && (
        <section className="bg-white pb-16">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 sm:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label} className="flex flex-col items-center text-center">
                <h3 className="text-[16px] font-bold uppercase tracking-[2px] text-black-soft">{spec.label}</h3>
                <Image
                  src={spec.icon}
                  alt=""
                  width={130}
                  height={140}
                  className="mt-4 h-[110px] w-auto object-contain"
                />
                <p className="mt-4 max-w-[280px] text-[15px] font-light leading-[25px] text-graphite">
                  {spec.value.split("; ").map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <CallToAction dict={dict} image={site.images.cta} site={site} />
    </>
  );
}
