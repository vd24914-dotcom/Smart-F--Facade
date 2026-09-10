import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Project } from "@/content/store";

/** Раскладка плиток на главной: 2-1-1 / 1-1-2 колонки, как в макете. */
const spans = ["lg:col-span-2", "lg:col-span-1", "lg:col-span-1", "lg:col-span-1", "lg:col-span-1", "lg:col-span-2"];

export default function Projects({
  dict,
  locale,
  projects,
  showHeading = true,
}: {
  dict: Dictionary;
  locale: Locale;
  projects: Project[];
  showHeading?: boolean;
}) {
  const tiles = projects.slice(0, 6);

  return (
    <section id="projects" className="bg-white">
      {showHeading && (
        <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-14 lg:pt-[50px]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[28px] font-extrabold uppercase leading-[1.25] text-black-soft lg:text-[36px] lg:leading-[45px]">
                {dict.projects.title}
              </h2>
              <div className="rule-gold mt-5" />
              <p className="mt-6 text-[16px] font-light leading-[27px] text-graphite lg:text-[18px]">
                {dict.projects.lead}
              </p>
            </div>

            <Link
              href={`/${locale}/projects`}
              className="inline-flex w-fit items-center gap-4 rounded-[30px] bg-gold-btn px-5 py-4 text-[14px] font-semibold leading-[14px] text-white transition-opacity hover:opacity-90"
            >
              {dict.projects.all}
              <Image src="/icons/arrow.svg" alt="" width={14} height={14} className="h-[14px] w-[14px]" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {tiles.map((project, index) => (
          <Link
            key={project.id}
            href={`/${locale}/projects/${project.id}`}
            className={`group relative isolate flex min-h-[320px] flex-col items-center justify-center overflow-hidden lg:min-h-[465px] ${spans[index]}`}
          >
            <Image
              src={project.image}
              alt={project.texts[locale].title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="-z-20 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-graphite/60" aria-hidden />

            <span
              className="pointer-events-none select-none text-[110px] font-semibold leading-none text-white/24 lg:text-[162px]"
              aria-hidden
            >
              {String(index + 1).padStart(2, "0")}.
            </span>
            <h3 className="mt-4 px-4 text-center text-[20px] font-bold uppercase leading-[35px] text-white lg:text-[28px]">
              {project.texts[locale].title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
