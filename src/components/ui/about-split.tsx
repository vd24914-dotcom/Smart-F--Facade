import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  /** надзаголовок мелкими прописными, например «О компании» */
  eyebrow?: string;
  title: string;
  /** абзацы: строка с переносами разбивается автоматически */
  text: string;
  image: string;
  action?: { label: string; href: string };
  /** мелкие плитки под текстом: фасады / интерьеры / мебель */
  chips?: { icon: string; label: string }[];
  /** фото слева (по умолчанию) или справа */
  imageSide?: "left" | "right";
  className?: string;
};

/** Блок «фото + рассказ о компании» с золотой чертой и кнопкой. */
export default function AboutSplit({
  eyebrow,
  title,
  text,
  image,
  action,
  chips,
  imageSide = "left",
  className,
}: Props) {
  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className={cn("bg-white pb-14 pt-20 lg:pb-20 lg:pt-28", className)}>
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-5 md:flex-row md:gap-14">
        <div
          className={cn(
            "relative w-full shrink-0 overflow-hidden rounded-2xl shadow-[0_30px_80px_-40px_rgba(41,79,123,0.55)] md:max-w-[440px]",
            imageSide === "right" && "md:order-2"
          )}
        >
          <Image
            src={image}
            alt={title}
            width={640}
            height={720}
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="w-full max-w-[640px] text-[15px] leading-[26px] text-graphite lg:text-[16px] lg:leading-[28px]">
          {eyebrow && (
            <p className="text-[13px] font-semibold uppercase tracking-[3px] text-gold">{eyebrow}</p>
          )}

          <h2 className="mt-2 text-[24px] font-extrabold uppercase leading-[1.2] text-navy lg:text-[32px]">
            {title}
          </h2>

          <div className="mt-4 h-[3px] w-24 rounded-full bg-gradient-to-r from-gold to-gold/10" />

          {paragraphs.map((paragraph, index) => (
            <p key={index} className={index === 0 ? "mt-7 font-light" : "mt-4 font-light"}>
              {paragraph}
            </p>
          ))}

          {chips && chips.length > 0 && (
            <ul className="mt-8 flex flex-wrap items-start gap-x-10 gap-y-6">
              {chips.map((chip) => (
                <li key={chip.label} className="flex items-center gap-3">
                  <Image
                    src={chip.icon}
                    alt=""
                    width={48}
                    height={48}
                    className="h-9 w-9 shrink-0 object-contain"
                  />
                  <span className="text-[13px] font-bold uppercase tracking-[1.5px] text-navy">
                    {chip.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {action && (
            <Link
              href={action.href}
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-navy px-7 py-3.5 text-[14px] font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-95"
            >
              <span>{action.label}</span>
              <svg width="13" height="12" viewBox="0 0 13 12" fill="none" aria-hidden>
                <path
                  d="M12.53 6.53a.75.75 0 0 0 0-1.06L7.757.697a.75.75 0 1 0-1.06 1.06L10.939 6l-4.242 4.243a.75.75 0 0 0 1.06 1.06zM0 6v.75h12v-1.5H0z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
