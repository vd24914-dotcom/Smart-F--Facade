import Reveal from "@/components/ui/reveal";
import CountUp from "@/components/ui/count-up";
import PhotoGrid from "@/components/ui/photo-grid";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Опыт группы компаний. Цифры относятся к работе в Кыргызстане — поэтому они
 * живут здесь, с явной подписью.
 *
 * Два вида, переключаются в админке:
 * — с фотографиями: слева текст и цифры, справа сетка фото объектов, которая
 *   плитки появляются одна за другой при прокрутке до блока;
 * — без фотографий: слева текст, справа цифры.
 */
export default function GroupExperience({
  dict,
  photos = [],
  showPhotos = false,
}: {
  dict: Dictionary;
  /** фотографии объектов из админки */
  photos?: string[];
  /** показывать сетку фотографий; выключено — старый вид с цифрами справа */
  showPhotos?: boolean;
}) {
  const group = dict.group;
  const stats = (group?.stats ?? []).filter((stat) => stat.value?.trim());
  // название и описание объекта идут по тому же индексу, что и его фото
  const objects = group?.objects ?? [];
  if (!group?.title?.trim() && stats.length === 0) return null;

  const statsList = stats.length > 0 && (
    <ul className={showPhotos ? "mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10" : "grid gap-4 sm:grid-cols-2 lg:gap-5"}>
      {stats.map((stat, index) => (
        <li
          key={stat.label || index}
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-6 text-center backdrop-blur lg:py-7"
        >
          <p className="whitespace-nowrap text-[30px] font-extrabold leading-none text-white sm:text-[34px] lg:text-[38px]">
            {/* набегает один раз, когда блок доезжает до экрана */}
            <CountUp value={stat.value} delay={index * 150} repeat={0} />
          </p>
          <p className="mt-3 text-[13px] font-light leading-[19px] text-mist">{stat.label}</p>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="bg-mist px-3 py-12 sm:px-5 lg:py-16">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-ink px-6 py-12 sm:px-10 lg:rounded-[40px] lg:px-14 lg:py-16">
        <div
          className={
            showPhotos
              ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center lg:gap-16"
              : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-16"
          }
        >
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

            {showPhotos && statsList}
          </div>

          {showPhotos ? (
            <PhotoGrid
              items={Array.from({ length: Math.max(photos.length, objects.length) }, (_, i) => ({
                src: photos[i] ?? "",
                title: objects[i]?.title ?? "",
                text: objects[i]?.text ?? "",
              }))}
              className="mx-auto max-w-[460px] lg:max-w-none"
            />
          ) : (
            statsList
          )}
        </div>
      </div>
    </section>
  );
}
