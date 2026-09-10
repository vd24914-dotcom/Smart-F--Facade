"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type BentoItem = {
  id: string;
  title: string;
  desc: string;
  url: string;
  href?: string;
  /** классы сетки, например "md:row-span-2" */
  span?: string;
};

type Props = {
  items: BentoItem[];
  title: string;
  description?: string;
  action?: { label: string; href: string };
  /** подпись кнопки в окне просмотра */
  openLabel?: string;
  className?: string;
};

/**
 * Лента проектов: плитки разной высоты, тянется мышкой, по клику — просмотр фото.
 * Без внешних библиотек анимации: появление на IntersectionObserver, остальное на CSS.
 */
export default function BentoGallery({
  items,
  title,
  description,
  action,
  openLabel,
  className,
}: Props) {
  const [active, setActive] = useState<BentoItem | null>(null);
  const [shown, setShown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  // автопрокрутка: вправо до конца, потом обратно
  const dirRef = useRef(1);
  const posRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeRef = useRef<number | null>(null);

  const pause = () => {
    pausedRef.current = true;
    if (resumeRef.current) window.clearTimeout(resumeRef.current);
  };

  const resumeSoon = (delay = 1800) => {
    if (resumeRef.current) window.clearTimeout(resumeRef.current);
    resumeRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, delay);
  };

  // появление блока при прокрутке
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // закрытие просмотра
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  // плавное движение ленты
  useEffect(() => {
    const box = scrollerRef.current;
    if (!box || items.length < 3) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();
    const speed = 26; // пикселей в секунду

    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;

      const max = box.scrollWidth - box.clientWidth;

      // если ленту двигали руками — подхватываем текущую позицию
      if (Math.abs(box.scrollLeft - posRef.current) > 2) posRef.current = box.scrollLeft;

      if (!pausedRef.current && !document.hidden && !active && max > 1) {
        posRef.current += (dirRef.current * speed * dt) / 1000;

        if (posRef.current >= max) {
          posRef.current = max;
          dirRef.current = -1;
        } else if (posRef.current <= 0) {
          posRef.current = 0;
          dirRef.current = 1;
        }
        box.scrollLeft = posRef.current;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      if (resumeRef.current) window.clearTimeout(resumeRef.current);
    };
  }, [items.length, active]);

  /* перетаскивание мышкой */
  const onPointerDown = (e: React.PointerEvent) => {
    const box = scrollerRef.current;
    pause();
    if (!box || e.pointerType === "touch") return;
    drag.current = { x: e.clientX, left: box.scrollLeft, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const box = scrollerRef.current;
    const start = drag.current;
    if (!box || !start) return;
    const delta = e.clientX - start.x;
    if (Math.abs(delta) > 4) start.moved = true;
    box.scrollLeft = start.left - delta;
  };

  const endDrag = () => {
    drag.current = null;
    resumeSoon();
  };

  const open = (item: BentoItem) => {
    if (drag.current?.moved) return;
    setActive(item);
  };

  if (items.length === 0) return null;

  return (
    <section ref={sectionRef} className={cn("relative overflow-hidden bg-white py-14 lg:py-20", className)}>
      <div className="mx-auto max-w-[1200px] px-5">
        <div
          className={cn(
            "flex flex-col gap-4 transition-all duration-700 md:flex-row md:items-end md:justify-between",
            shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}
        >
          <div>
            <h2 className="text-[24px] font-extrabold uppercase leading-[1.2] text-navy lg:text-[32px]">
              {title}
            </h2>
            <div className="mt-4 h-[3px] w-24 rounded-full bg-gradient-to-r from-gold to-gold/10" />
            {description && (
              <p className="mt-5 max-w-[620px] text-[15px] font-light leading-[26px] text-graphite lg:text-[16px]">
                {description}
              </p>
            )}
          </div>

          {action && (
            <Link
              href={action.href}
              className="inline-flex shrink-0 items-center gap-3 rounded-full bg-navy px-6 py-3.5 text-[14px] font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-95"
            >
              {action.label}
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

      <div
        ref={scrollerRef}
        onMouseEnter={pause}
        onMouseLeave={() => resumeSoon(600)}
        onTouchStart={pause}
        onTouchEnd={() => resumeSoon(2500)}
        onWheel={() => {
          pause();
          resumeSoon(2500);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        className="mt-10 w-full cursor-grab overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      >
        <div className="mx-auto grid w-max auto-cols-[16rem] grid-flow-col grid-rows-1 gap-4 px-5 md:auto-cols-[19rem] md:grid-rows-[180px_180px] lg:px-[max(1.25rem,calc((100vw-1200px)/2))]">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item)}
              aria-label={item.title}
              className={cn(
                "group relative flex h-[16rem] w-full select-none items-end overflow-hidden rounded-2xl bg-mist text-left shadow-[0_20px_50px_-35px_rgba(8,19,36,0.6)] transition-all duration-700 md:h-auto",
                item.span,
                shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              )}
              style={{ transitionDelay: shown ? `${Math.min(index, 8) * 70}ms` : "0ms" }}
            >
              <Image
                src={item.url}
                alt={item.title}
                fill
                draggable={false}
                sizes="(max-width: 768px) 70vw, 400px"
                className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="pointer-events-none relative z-10 p-5 transition-transform duration-500 md:translate-y-2 md:group-hover:translate-y-0">
                <h3 className="text-[16px] font-bold uppercase leading-[1.2] text-white">
                  {item.title}
                </h3>
                {item.desc && (
                  <p className="mt-1.5 line-clamp-2 text-[13px] font-light text-white/75 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100">
                    {item.desc}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* просмотр фото — рисуем в body, чтобы шапка не перекрывала */}
      {active && mounted &&
        createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div
            className="modal-card relative w-full max-w-[1000px]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.title}
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-bold uppercase text-white">{active.title}</h3>
                {active.desc && (
                  <p className="mt-1 max-w-[640px] text-[14px] font-light text-white/70">
                    {active.desc}
                  </p>
                )}
              </div>
              {active.href && (
                <Link
                  href={active.href}
                  className="rounded-full bg-white px-6 py-3 text-[13px] font-semibold text-navy transition hover:opacity-90"
                >
                  {openLabel ?? "Открыть"}
                </Link>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Закрыть"
            className="absolute right-5 top-5 text-white/70 transition-colors hover:text-white"
          >
            <X size={26} />
          </button>
        </div>,
        document.body
      )}
    </section>
  );
}
