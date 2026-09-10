import Image from "next/image";
import { Users, Building2, Ruler, Globe, LayoutGrid, MessageCircle } from "lucide-react";
import PillButton from "@/components/ui/pill-button";
import ContactButton from "@/components/ContactButton";
import CountUp from "@/components/ui/count-up";
import ScrollFade from "@/components/ui/scroll-fade";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/content/store";

const statIcons = [Users, Building2, Ruler, Globe];

/** Первый экран: светлый фон, крупный заголовок, фото и карточка с цифрами внизу. */
export default function Hero({
  dict,
  locale,
  site,
}: {
  dict: Dictionary;
  locale: Locale;
  site: SiteContent;
}) {
  const [firstLine, ...restLines] = dict.hero.title;

  // min-h вместо жёсткой высоты: на маленьких экранах блок дорастает под
  // содержимое, поэтому карточку с цифрами больше не обрезает
  return (
    <section className="sticky top-0 isolate flex min-h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-white via-[#eef4fa] to-white pt-20 dark:from-[#0b1523] dark:via-[#0e1a2c] dark:to-[#0b1523] sm:pt-24 lg:pt-28">
      {/* мягкое свечение слева сверху */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[520px] rounded-full bg-navy/10 blur-[160px]"
      />

      {/* фото на весь экран, уходит в светлый градиент */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={site.images.hero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/85 to-white/70 dark:from-[#0b1523] dark:via-[#0b1523]/90 dark:to-[#0b1523]/75 lg:hidden" />
        <div
          className="absolute inset-0 hidden lg:block dark:lg:hidden"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #ffffff 0%, #ffffff 26%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.6) 55%, rgba(255,255,255,0.15) 72%, rgba(255,255,255,0) 86%)",
          }}
        />
        <div
          className="absolute inset-0 hidden dark:lg:block"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #0b1523 0%, #0b1523 26%, rgba(11,21,35,0.92) 40%, rgba(11,21,35,0.62) 55%, rgba(11,21,35,0.2) 72%, rgba(11,21,35,0) 86%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-[#0b1523]" />
      </div>

      <ScrollFade className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-5">
        <div className="flex max-w-[660px] flex-1 flex-col justify-center py-4 sm:py-8 lg:py-10">
          <h1 className="text-[28px] font-extrabold leading-[1.12] tracking-[-0.5px] text-ink min-[380px]:text-[32px] sm:text-[44px] lg:text-[52px]">
            <span className="block">{firstLine}</span>
            {restLines.map((line) => (
              <span key={line} className="block text-navy">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-4 max-w-[520px] text-[15px] font-light leading-[24px] text-graphite sm:mt-6 sm:text-[16px] sm:leading-[28px] lg:text-[17px] lg:leading-[30px]">
            {dict.hero.lead}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-9">
            <PillButton
              href={`/${locale}/services`}
              icon={<LayoutGrid className="size-4" strokeWidth={1.8} />}
            >
              {dict.nav.services}
            </PillButton>
            <ContactButton className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-[14px] sm:px-6 sm:py-3.5 font-semibold text-navy backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-white">
              <MessageCircle className="size-4" strokeWidth={1.8} />
              {dict.cta.button}
            </ContactButton>
          </div>
        </div>

        {/* Карточка с цифрами. На телефоне — три компактных столбца: столбиком
            она не помещалась в экран и нижнюю строку обрезало. */}
        {dict.stats.length > 0 && (
          <div className="stats-card relative z-10 mb-5 mt-4 rounded-2xl border border-navy/20 bg-white/90 px-3 py-4 shadow-[0_25px_60px_-28px_rgba(41,79,123,0.6)] ring-1 ring-inset ring-navy/[0.06] backdrop-blur sm:mt-8 sm:px-8 sm:py-6 lg:mb-12">
            <ul className="grid grid-cols-3 gap-2 sm:gap-0">
              {dict.stats.map((stat, index) => {
                const Icon = statIcons[index % statIcons.length];
                return (
                  <li
                    key={stat.label}
                    className="flex flex-col items-center gap-1 px-1 text-center sm:flex-row sm:justify-center sm:gap-4 sm:px-6 sm:text-left sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-slate-200"
                  >
                    <Icon className="size-5 shrink-0 text-navy sm:size-8" strokeWidth={1.5} />
                    <div>
                      <p className="text-[18px] font-extrabold leading-none text-ink sm:text-[24px] lg:text-[28px]">
                        <CountUp value={stat.value} delay={index * 150} />
                      </p>
                      <p className="mt-1 text-[11px] leading-[14px] text-slate-500 sm:mt-1.5 sm:text-[13px] sm:leading-normal">
                        {stat.label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </ScrollFade>
    </section>
  );
}
