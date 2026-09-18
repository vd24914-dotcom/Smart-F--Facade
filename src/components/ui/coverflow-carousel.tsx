"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { openContactModal } from "@/components/ContactModal";
import { cn } from "@/lib/utils";

export type CoverflowItem = {
  title: string;
  text: string;
  /** фото материала; SVG покажем как иконку на заглушке, без картинки — заглушка с номером */
  img?: string;
};

type Props = {
  id?: string;
  /** маленькая подпись над заголовком */
  eyebrow?: string;
  title?: string;
  description?: string;
  items: CoverflowItem[];
  /** кнопка на карточке — открывает окно с полным описанием */
  moreLabel: string;
  /** кнопка в окне — открывает форму расчёта */
  ctaLabel: string;
  autoplay?: boolean;
  /** пауза между слайдами, мс */
  autoplayDelay?: number;
  className?: string;
};

/** Геометрия сцены: карточка и сдвиги соседей подстраиваются под ширину экрана. */
type Stage = { width: number; height: number; near: number; far: number };

const STAGES: { max: number; stage: Stage }[] = [
  { max: 480, stage: { width: 236, height: 360, near: 165, far: 290 } },
  { max: 1024, stage: { width: 280, height: 420, near: 232, far: 410 } },
  { max: Infinity, stage: { width: 330, height: 500, near: 285, far: 510 } },
];

function pickStage(width: number) {
  return (STAGES.find((entry) => width < entry.max) ?? STAGES[STAGES.length - 1]).stage;
}

function isSvg(src?: string) {
  return (src ?? "").trim().toLowerCase().split("?")[0].endsWith(".svg");
}

const ChevronLeft = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const ArrowRight = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

/** Условный «фасад»: слои панелей — пока фото не загрузили. */
const LayersIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className={className} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 9 5 9-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 16 9 5 9-5" />
  </svg>
);

/**
 * Картинка карточки. Фото растягиваем на всю карточку; если файла нет или это
 * SVG-иконка — рисуем спокойную заглушку с номером, чтобы карусель не выглядела пустой.
 */
function Picture({
  src,
  alt,
  sizes,
  iconSize = "size-16",
  onFail,
}: {
  src?: string;
  alt: string;
  sizes: string;
  iconSize?: string;
  /** файл не загрузился — родитель переключается на светлое оформление */
  onFail?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const clean = (src ?? "").trim();
  const photo = clean && !isSvg(clean) && !failed;
  const fail = () => {
    setFailed(true);
    onFail?.();
  };

  if (photo) {
    return <Image src={clean} alt={alt} fill sizes={sizes} className="object-cover" onError={fail} />;
  }

  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(41,79,123,0.14),transparent_60%),linear-gradient(180deg,#ffffff_0%,#f0f5fa_100%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(138,180,232,0.18),transparent_60%),linear-gradient(180deg,#16243a_0%,#0b1523_100%)]">
      <div className="absolute inset-x-0 top-[26%] flex justify-center">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border border-navy/20 text-navy",
            "before:absolute before:-inset-3 before:rounded-full before:border before:border-navy/10",
            iconSize
          )}
        >
          {clean && isSvg(clean) && !failed ? (
            <Image
              src={clean}
              alt=""
              width={40}
              height={40}
              className="size-1/2 object-contain"
              onError={fail}
            />
          ) : (
            <LayersIcon className="size-1/2" />
          )}
        </div>
      </div>
    </div>
  );
}

/** Окно с полным описанием материала и кнопкой на расчёт. */
function MaterialDialog({
  item,
  ctaLabel,
  onClose,
}: {
  item: CoverflowItem;
  ctaLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="modal-backdrop absolute inset-0 cursor-default bg-ink/70 backdrop-blur-sm"
      />

      <div className="modal-card relative max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-3xl bg-white shadow-[0_40px_90px_-40px_rgba(8,19,36,0.75)]">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-3xl bg-mist">
          <Picture
            src={item.img}
            alt={item.title}
            sizes="(max-width: 640px) 100vw, 640px"
            iconSize="size-20"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          <h2 className="text-[20px] font-extrabold uppercase leading-[1.25] text-navy sm:text-[24px]">
            {item.title}
          </h2>
          <div className="mt-4 h-[3px] w-20 rounded-full bg-gradient-to-r from-gold to-gold/10" />
          {item.text?.trim() && (
            <p className="mt-4 whitespace-pre-line text-[15px] font-light leading-[26px] text-graphite">
              {item.text}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              openContactModal();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-gold to-[#a48256] px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#0f1a2b] shadow-[0_8px_24px_rgba(197,164,126,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(197,164,126,0.45)]"
          >
            {ctaLabel}
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Одна карточка. С фотографией — снимок на всю карточку и белый текст на тёмной
 * подложке; без фотографии — светлая карточка с синим текстом, как остальные блоки.
 */
function Card({
  item,
  center,
  hidden,
  moreLabel,
  sizes,
  style,
  onSelect,
  onOpen,
}: {
  item: CoverflowItem;
  center: boolean;
  hidden: boolean;
  moreLabel: string;
  sizes: string;
  style: React.CSSProperties;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const clean = (item.img ?? "").trim();
  const photo = !!clean && !isSvg(clean) && !failed;

  return (
    <div
      onClick={() => (center ? onOpen() : onSelect())}
      aria-hidden={!center}
      className={cn(
        "absolute cursor-pointer overflow-hidden rounded-[18px] border transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)]",
        photo ? "border-white/10 bg-[#111e30]" : "border-navy/10 bg-white dark:border-white/10",
        center
          ? "shadow-[0_25px_60px_-20px_rgba(8,19,36,0.55),0_0_35px_rgba(197,164,126,0.2)]"
          : "shadow-[0_15px_35px_-15px_rgba(8,19,36,0.4)]"
      )}
      style={{ ...style, transformOrigin: "center center", pointerEvents: hidden ? "none" : "auto" }}
    >
      <Picture src={item.img} alt={item.title} sizes={sizes} onFail={() => setFailed(true)} />

      {/* затемнение, чтобы текст читался на любом фото */}
      {photo && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.7)_60%,rgba(0,0,0,0.96)_100%)]"
        />
      )}

      {/* текст: показываем только на центральной карточке */}
      <div
        className={cn(
          "relative z-20 flex h-full w-full flex-col justify-between px-4 pb-5 pt-4 text-center transition-all duration-500",
          center ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <div className="mt-auto flex flex-col items-center gap-1">
          <h3
            className={cn(
              "line-clamp-3 text-[18px] font-extrabold uppercase leading-[1.15] tracking-[0.03em] sm:text-[21px]",
              photo ? "text-white [text-shadow:0_3px_12px_rgba(0,0,0,0.95)]" : "text-navy"
            )}
          >
            {item.title}
          </h3>
          <div className="my-2 h-[2px] w-9 rounded-full bg-gold shadow-[0_0_8px_rgba(197,164,126,0.5)]" />
          {item.text?.trim() && (
            <p
              className={cn(
                "line-clamp-3 max-w-[280px] text-[12.5px] font-light leading-[1.4] sm:line-clamp-4 sm:text-[13px]",
                photo ? "text-white/85 [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]" : "text-graphite"
              )}
            >
              {item.text}
            </p>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-gold to-[#a48256] px-[18px] py-[7px] text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f1a2b] shadow-[0_6px_16px_rgba(197,164,126,0.35)] transition hover:-translate-y-0.5"
          >
            {moreLabel}
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Карусель «обложек»: центральная карточка крупно, соседи уходят вглубь под углом.
 * Стрелки, точки, свайп и клавиши ←/→ (когда фокус внутри блока). Автопрокрутка
 * останавливается, пока курсор над блоком или открыто окно с описанием.
 */
export default function CoverflowCarousel({
  id,
  eyebrow,
  title,
  description,
  items,
  moreLabel,
  ctaLabel,
  autoplay = true,
  autoplayDelay = 5000,
  className,
}: Props) {
  const list = items.filter((item) => item.title?.trim());
  const total = list.length;

  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [opened, setOpened] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>(STAGES[STAGES.length - 1].stage);
  const touchStartX = useRef(0);

  const next = useCallback(() => setCurrent((prev) => (prev + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((prev) => (prev - 1 + total) % total), [total]);
  const close = useCallback(() => setOpened(null), []);

  // сцена под ширину экрана — считаем только в браузере, чтобы разметка сервера совпала
  useEffect(() => {
    const update = () => setStage(pickStage(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!autoplay || hovered || opened !== null || total <= 1) return;
    const timer = setInterval(next, autoplayDelay);
    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, hovered, opened, next, total]);

  if (total === 0) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) < 45) return;
    if (diff < 0) next();
    else prev();
  };

  /** положение карточки относительно центральной: 0 — центр, ±1 и ±2 — соседи, 9 — скрыта */
  const place = (index: number) => {
    const offset = (index - current + total) % total;
    if (offset === 0) return { t: "translateX(0) scale(1) rotateY(0deg)", o: 1, z: 30, f: "brightness(1)", pos: 0 };
    if (offset === 1)
      return { t: `translateX(${stage.near}px) scale(0.84) rotateY(-24deg)`, o: 0.7, z: 20, f: "brightness(0.92)", pos: 1 };
    if (offset === 2)
      return { t: `translateX(${stage.far}px) scale(0.68) rotateY(-38deg)`, o: 0.45, z: 10, f: "brightness(0.85) blur(1px)", pos: 2 };
    if (offset === total - 1)
      return { t: `translateX(-${stage.near}px) scale(0.84) rotateY(24deg)`, o: 0.7, z: 20, f: "brightness(0.92)", pos: -1 };
    if (offset === total - 2)
      return { t: `translateX(-${stage.far}px) scale(0.68) rotateY(38deg)`, o: 0.45, z: 10, f: "brightness(0.85) blur(1px)", pos: -2 };
    return { t: "translateX(0) scale(0.4) rotateY(0deg)", o: 0, z: 0, f: "brightness(0.4) blur(2px)", pos: 9 };
  };

  return (
    <section
      id={id}
      className={cn(
        "relative isolate overflow-hidden bg-mist py-16 scroll-mt-24 select-none lg:py-20",
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
    >
      {/* мягкое свечение сверху — как у остальных светлых блоков */}
      <div
        className="pointer-events-none absolute -top-72 left-1/2 -z-10 size-[520px] -translate-x-1/2 rounded-full bg-navy/20 blur-[300px]"
        aria-hidden
      />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-5">
        {eyebrow && (
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-9 bg-gradient-to-r from-transparent to-gold" aria-hidden />
            <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-gold">{eyebrow}</span>
            <span className="h-px w-9 bg-gradient-to-r from-gold to-transparent" aria-hidden />
          </div>
        )}
        {title && (
          <h2 className="text-center text-[26px] font-extrabold uppercase leading-[1.25] text-navy lg:text-[36px]">
            {title}
          </h2>
        )}
        <div className="rule-gold mt-5" />
        {description && (
          <p className="mt-5 max-w-[640px] text-center text-[15px] font-light leading-[26px] text-graphite lg:text-[17px]">
            {description}
          </p>
        )}

        {/* сцена */}
        <div className="relative mt-10 w-full">
          <div
            className="relative flex w-full items-center justify-center"
            style={{ perspective: "1400px", height: stage.height }}
          >
            {list.map((item, index) => {
              const { t, o, z, f, pos } = place(index);
              return (
                <Card
                  key={item.title + index}
                  item={item}
                  center={pos === 0}
                  hidden={pos === 9}
                  moreLabel={moreLabel}
                  sizes="(max-width: 480px) 240px, (max-width: 1024px) 280px, 330px"
                  style={{ width: stage.width, height: stage.height, transform: t, opacity: o, zIndex: z, filter: f }}
                  onSelect={() => setCurrent(index)}
                  onOpen={() => setOpened(index)}
                />
              );
            })}
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous"
                className="absolute left-0 top-1/2 z-40 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-[0_8px_24px_rgba(8,19,36,0.18)] transition hover:border-navy hover:bg-navy hover:text-white sm:left-2"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next"
                className="absolute right-0 top-1/2 z-40 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-[0_8px_24px_rgba(8,19,36,0.18)] transition hover:border-navy hover:bg-navy hover:text-white sm:right-2"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {list.map((item, index) => (
              <button
                key={item.title + index}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`${index + 1}`}
                aria-current={index === current}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === current
                    ? "w-7 bg-gold shadow-[0_0_10px_rgba(197,164,126,0.7)]"
                    : "w-2 bg-navy/20 hover:bg-navy/40"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {opened !== null && list[opened] && (
        <MaterialDialog item={list[opened]} ctaLabel={ctaLabel} onClose={close} />
      )}
    </section>
  );
}
