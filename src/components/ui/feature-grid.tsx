import Image from "next/image";
import Reveal, { RevealGroup } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export type Feature = {
  title: string;
  text: string;
  /** путь к иконке из public/; без неё карточка покажет номер */
  icon?: string;
};

type Props = {
  id?: string;
  title?: string;
  description?: string;
  items: Feature[];
  /** крупная цифра в первой карточке, например «10+ лет на рынке» */
  highlight?: { value: string; label: string };
  /** фон блока: серый (по умолчанию) или белый — чтобы соседние блоки не сливались */
  tone?: "mist" | "white";
  className?: string;
};

/** Рисованный овал под крупной цифрой. */
const Blob = () => (
  <svg
    className="absolute inset-0 size-full text-navy/10"
    viewBox="0 0 254 104"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z"
      fill="currentColor"
    />
  </svg>
);

/** Преимущества плитками разного размера: крупная цифра и карточки с иконками. */
export default function FeatureGrid({
  id,
  title,
  description,
  items,
  highlight,
  tone = "mist",
  className,
}: Props) {
  if (items.length === 0) return null;

  // раскладка на 6 колонок: строки должны складываться ровно в 6
  const pattern = highlight
    ? ["lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3"]
    : items.length % 3 === 0
      ? ["lg:col-span-2"]
      : ["lg:col-span-3"];

  const cardBase =
    "group relative col-span-full overflow-hidden rounded-2xl border border-navy/10 bg-white p-6 shadow-[0_25px_60px_-45px_rgba(8,19,36,0.55)] transition duration-300 hover:-translate-y-1 hover:border-navy/25 sm:col-span-3";

  return (
    <section
      id={id}
      className={cn(
        "relative isolate overflow-hidden py-16 lg:py-20 scroll-mt-24",
        tone === "white" ? "bg-white" : "bg-mist",
        className
      )}
    >
      <div
        className="absolute -top-72 left-1/2 -z-10 size-[520px] -translate-x-1/2 rounded-full bg-navy/20 blur-[300px]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1200px] px-5">
        {title && (
          <Reveal>
            <h2 className="mx-auto text-center text-[26px] font-extrabold uppercase leading-[1.25] text-navy lg:text-[36px]">
              {title}
            </h2>
          </Reveal>
        )}
        <Reveal delay={100}>
          <div className="rule-gold mx-auto mt-5" />
        </Reveal>
        {description && (
          <Reveal delay={180}>
            <p className="mx-auto mt-5 max-w-[640px] text-center text-[15px] font-light leading-[26px] text-graphite lg:text-[17px]">
              {description}
            </p>
          </Reveal>
        )}

        <RevealGroup className="mt-12 grid grid-cols-6 gap-4" step={110}>
          {highlight && (
            <div className={cn(cardBase, "flex lg:col-span-2")}>
              <div className="relative m-auto size-fit py-4">
                <div className="relative flex h-24 w-56 items-center">
                  <Blob />
                  <span className="mx-auto block w-fit text-[44px] font-extrabold leading-none text-navy">
                    {highlight.value}
                  </span>
                </div>
                <h3 className="mt-5 text-center text-[16px] font-bold uppercase leading-[22px] text-navy">
                  {highlight.label}
                </h3>
              </div>
            </div>
          )}

          {items.map((item, index) => (
            <article
              key={item.title || index}
              className={cn(cardBase, pattern[index % pattern.length])}
            >
              <div className="relative flex aspect-square size-14 rounded-full border border-navy/15 before:absolute before:-inset-2 before:rounded-full before:border before:border-navy/10">
                {item.icon ? (
                  <Image
                    src={item.icon}
                    alt=""
                    width={56}
                    height={56}
                    className="m-auto h-7 w-7 object-contain"
                  />
                ) : (
                  <span className="m-auto text-[15px] font-bold text-navy">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-[17px] font-bold uppercase leading-[24px] text-navy">
                  {item.title}
                </h3>
                <p className="text-[15px] font-light leading-[25px] text-graphite">{item.text}</p>
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -right-10 size-40 rounded-full bg-navy/[0.04] transition duration-500 group-hover:bg-gold/10"
              />
            </article>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
