"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref: string;
}

interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number;
  /** первые N картинок грузятся сразу — блок стоит на первом экране */
  priorityCount?: number;
}

/**
 * Карточки-«гармошка»: активная раскрывается, остальные сжимаются в узкие полосы.
 *
 * Направление раскрытия задаётся только через CSS (переменная --track + брейкпоинт md),
 * без замера ширины окна в JS. Поэтому при загрузке страницы блок сразу рисуется правильно
 * и не «прыгает» из вертикального в горизонтальный.
 */
export const ExpandingCards = React.forwardRef<HTMLUListElement, ExpandingCardsProps>(
  ({ className, items, defaultActiveIndex = 0, priorityCount = 2, ...props }, ref) => {
    const [activeIndex, setActiveIndex] = React.useState<number>(defaultActiveIndex);

    const track = items.map((_, index) => (index === activeIndex ? "5fr" : "1fr")).join(" ");

    return (
      <ul
        ref={ref}
        className={cn(
          "grid w-full gap-2",
          "grid-cols-[1fr] grid-rows-[var(--track)] md:grid-cols-[var(--track)] md:grid-rows-[1fr]",
          "transition-[grid-template-columns,grid-template-rows] duration-500 ease-out",
          "h-[560px] md:h-[460px]",
          className
        )}
        style={{ "--track": track } as React.CSSProperties}
        {...props}
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            className="group relative min-h-0 min-w-0 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-graphite shadow-sm md:min-w-[76px]"
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
            tabIndex={0}
            data-active={activeIndex === index}
          >
            <Image
              src={item.imgSrc}
              alt={item.title}
              fill
              priority={index < priorityCount}
              loading={index < priorityCount ? undefined : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 720px"
              className="object-cover transition-transform duration-500 ease-out group-data-[active=true]:scale-100 md:scale-105"
            />

            {/* Свёрнутая карточка — плотная синяя вуаль, активная открывает фото */}
            <div
              className="absolute inset-0 bg-navy/55 transition-opacity duration-500 ease-out group-data-[active=true]:opacity-0"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" aria-hidden />

            <article className="absolute inset-0 flex flex-col justify-end gap-2 p-4">
              {/* Название свёрнутой карточки: вертикально на десктопе */}
              <h3 className="absolute bottom-5 left-4 hidden origin-bottom-left rotate-[-90deg] whitespace-nowrap text-[13px] font-bold uppercase tracking-[2px] text-white drop-shadow-[0_1px_6px_rgba(8,19,36,0.9)] transition-opacity duration-300 ease-out group-data-[active=true]:opacity-0 md:block">
                {item.title}
              </h3>

              {/* …и горизонтально на мобильных */}
              <h3 className="absolute bottom-3 left-4 text-[12px] font-bold uppercase tracking-[1px] text-white drop-shadow-[0_1px_6px_rgba(8,19,36,0.9)] transition-opacity duration-300 ease-out group-data-[active=true]:opacity-0 md:hidden">
                {item.title}
              </h3>

              <div className="text-gold opacity-0 transition-all delay-75 duration-300 ease-out group-data-[active=true]:opacity-100">
                {item.icon}
              </div>
              <h3 className="text-[18px] font-bold uppercase leading-[24px] text-white opacity-0 transition-all delay-150 duration-300 ease-out group-data-[active=true]:opacity-100 lg:text-[20px]">
                {item.title}
              </h3>
              <p className="line-clamp-3 w-full max-w-xs text-[13px] font-light leading-[20px] text-white/85 opacity-0 transition-all delay-200 duration-300 ease-out group-data-[active=true]:opacity-100">
                {item.description}
              </p>
            </article>

            {/* Ссылка поверх карточки: активная карточка кликается целиком */}
            <Link href={item.linkHref} className="absolute inset-0 z-10" aria-label={item.title} tabIndex={-1} />
          </li>
        ))}
      </ul>
    );
  }
);

ExpandingCards.displayName = "ExpandingCards";
