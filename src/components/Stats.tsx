import type { Dictionary } from "@/i18n/dictionaries";
import CountUp from "@/components/ui/count-up";

/** Полоса с цифрами: числа набегают, черты прочерчиваются от центра. Цикл 10 секунд. */
export default function Stats({ dict }: { dict: Dictionary }) {
  // цифры относятся к опыту в Кыргызстане и живут в блоке «Опыт группы компаний»
  const stats = (dict.group?.stats ?? []).filter((stat) => stat.value?.trim());
  if (stats.length === 0) return null;

  return (
    <section className="stats-row bg-white py-12">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 sm:grid-cols-2 sm:gap-0">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`stats-row__item px-2.5 ${index < stats.length - 1 ? "sm:border-r sm:border-hairline/40" : ""}`}
            style={{ ["--stat-delay" as string]: `${index * 180}ms` }}
          >
            <div className="flex items-center gap-4">
              <span className="stats-row__line stats-row__line--left h-px flex-1 bg-hairline/30" aria-hidden />
              <CountUp
                value={stat.value}
                delay={index * 180}
                className="text-[40px] font-semibold leading-[50px] text-gold lg:text-[50px]"
              />
              <span className="stats-row__line stats-row__line--right h-px flex-1 bg-hairline/30" aria-hidden />
            </div>
            <p className="stats-row__label mt-1 text-center text-[14px] uppercase tracking-[2px] text-black-soft lg:text-[16.2px]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
