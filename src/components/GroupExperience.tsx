import Reveal from "@/components/ui/reveal";
import CountUp from "@/components/ui/count-up";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Опыт группы компаний. Цифры относятся к работе в Кыргызстане — поэтому они
 * живут отдельным блоком с явной подписью, а не в шапке сайта.
 */
export default function GroupExperience({ dict }: { dict: Dictionary }) {
  const group = dict.group;
  const stats = (group?.stats ?? []).filter((stat) => stat.value?.trim());
  if (!group?.title?.trim() && stats.length === 0) return null;

  return (
    <section className="bg-mist px-3 py-12 sm:px-5 lg:py-16">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-ink px-6 py-12 sm:px-10 lg:rounded-[40px] lg:px-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <div className="rule-gold" />
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 text-[24px] font-extrabold uppercase leading-[1.25] text-white lg:text-[32px]">
                {group.title}
              </h2>
            </Reveal>
            {group.lead?.trim() && (
              <Reveal delay={140}>
                <p className="mt-4 text-[16px] font-semibold leading-[26px] text-gold lg:text-[17px]">
                  {group.lead}
                </p>
              </Reveal>
            )}
            {group.text?.trim() && (
              <Reveal delay={200}>
                <p className="mt-4 text-[15px] font-light leading-[26px] text-mist lg:text-[17px] lg:leading-[29px]">
                  {group.text}
                </p>
              </Reveal>
            )}
          </div>

          {stats.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:gap-5">
              {stats.map((stat, index) => (
                <li
                  key={stat.label || index}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-7 text-center backdrop-blur"
                >
                  <p className="whitespace-nowrap text-[30px] font-extrabold leading-none text-white sm:text-[34px] lg:text-[38px]">
                    <CountUp value={stat.value} delay={index * 150} />
                  </p>
                  <p className="mt-3 text-[13px] font-light leading-[19px] text-mist">{stat.label}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
