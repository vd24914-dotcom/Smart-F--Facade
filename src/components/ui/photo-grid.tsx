"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PhotoItem = {
  src: string;
  /** название здания — подпись внизу плитки и заголовок окна */
  title: string;
  /** полное описание; без него в окне только фото и название */
  text: string;
};

/**
 * Раскладка под любое число фотографий — без пустых ячеек.
 *
 * Считаем колонки и ряды, а «лишние» ячейки закрываем плитками покрупнее:
 * одна ячейка — высокая плитка (2 ряда), две — высокая и широкая,
 * три — большая квадратная (2 × 2). Так и 5, и 7, и 13 фото встают ровно.
 */
function layout(count: number) {
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const extra = cols * rows - count;

  /** роль плитки по её месту: сколько колонок и рядов она занимает */
  const span = (index: number): [number, number] => {
    if (extra === 3 && index === 0) return [2, 2];
    if (extra >= 1 && index === 0) return rows > 1 ? [1, 2] : [2, 1];
    if (extra >= 2 && index === 1) return [2, 1];
    return [1, 1];
  };

  return { cols, rows, span };
}

/** Условный «фасад»: слои панелей — пока фото не загрузили. */
const LayersIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className={className} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 9 5 9-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 16 9 5 9-5" />
  </svg>
);

/** Плитка без фото: спокойная заглушка, чтобы сетка не выглядела дырявой. */
function Placeholder({ index }: { index: number }) {
  const shade = ["bg-white/[0.05]", "bg-white/[0.08]", "bg-white/[0.11]"][index % 3];
  return (
    <div className={cn("flex size-full items-center justify-center border border-white/10 text-gold/60", shade)}>
      <LayersIcon className="size-6 sm:size-7" />
    </div>
  );
}

/** Окно с фотографией объекта: название и, если есть, полное описание. */
function ObjectDialog({ item, onClose }: { item: PhotoItem; onClose: () => void }) {
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

  const hasText = item.text?.trim().length > 0;

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
        className="modal-backdrop absolute inset-0 cursor-default bg-ink/80 backdrop-blur-sm"
      />

      <div className="modal-card relative max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-3xl bg-white shadow-[0_40px_90px_-40px_rgba(8,19,36,0.75)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-3xl bg-ink sm:aspect-[16/10]">
          {item.src ? (
            <Image src={item.src} alt={item.title} fill sizes="(max-width: 760px) 100vw, 760px" className="object-cover" />
          ) : (
            <div className="absolute inset-0">
              <Placeholder index={0} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <div className="p-6 sm:p-8">
          <h3 className="text-[20px] font-extrabold uppercase leading-[1.25] text-navy sm:text-[24px]">{item.title}</h3>
          {hasText && (
            <>
              <div className="mt-4 h-[3px] w-20 rounded-full bg-gradient-to-r from-gold to-gold/10" />
              <p className="mt-4 whitespace-pre-line text-[15px] font-light leading-[26px] text-graphite">{item.text}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Сетка фотографий объектов. Плитки появляются одна за другой, когда сетка
 * доезжает до экрана. Внизу плитки — название здания, по клику открывается
 * окно с полным описанием. Число фотографий любое; без них — четыре заглушки.
 */
export default function PhotoGrid({ items, className }: { items: PhotoItem[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [opened, setOpened] = useState<number | null>(null);
  const close = useCallback(() => setOpened(null), []);

  const list = items
    .map((item) => ({ src: item.src?.trim() ?? "", title: item.title?.trim() ?? "", text: item.text ?? "" }))
    .filter((item) => item.src || item.title);
  const tiles: PhotoItem[] = list.length ? list : Array.from({ length: 4 }, () => ({ src: "", title: "", text: "" }));
  const { cols, rows, span } = layout(tiles.length);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={ref}
        // те же классы, что у RevealGroup: дети всплывают по очереди
        className={cn("sf-reveal-group grid w-full gap-1.5", visible && "is-visible", className)}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridAutoFlow: "dense",
          aspectRatio: `${cols} / ${rows}`,
          ["--reveal-step" as string]: "70ms",
        }}
      >
        {tiles.map((item, index) => {
          const [c, r] = span(index);
          const clickable = Boolean(item.title);
          const Tag = clickable ? "button" : "div";
          return (
            <Tag
              key={item.src + item.title + index}
              type={clickable ? "button" : undefined}
              onClick={clickable ? () => setOpened(index) : undefined}
              className={cn(
                "group relative overflow-hidden rounded-md bg-white/[0.06] text-left",
                clickable && "cursor-pointer"
              )}
              style={{ gridColumn: `span ${c}`, gridRow: `span ${r}` }}
            >
              {item.src ? (
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <Placeholder index={index} />
              )}
              {item.title && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,19,36,0)_50%,rgba(8,19,36,0.85)_100%)]"
                  />
                  <p className="absolute inset-x-0 bottom-0 line-clamp-2 px-2.5 pb-2 text-[11px] font-bold uppercase leading-[14px] text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.6)] sm:px-3 sm:pb-2.5 sm:text-[12px] sm:leading-[15px]">
                    {item.title}
                  </p>
                </>
              )}
            </Tag>
          );
        })}
      </div>

      {opened !== null && tiles[opened] && <ObjectDialog item={tiles[opened]} onClose={close} />}
    </>
  );
}
