"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

/**
 * Сетка фотографий объектов. Плитки просто появляются одна за другой,
 * когда сетка доезжает до экрана, — так же, как карточки в других блоках.
 * Число фотографий любое; без фотографий показываем четыре заглушки.
 */
export default function PhotoGrid({ photos, className }: { photos: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const list = photos.map((src) => src.trim()).filter(Boolean);
  const tiles = list.length ? list : ["", "", "", ""];
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
      {tiles.map((src, index) => {
        const [c, r] = span(index);
        return (
          <div
            key={src + index}
            className="relative overflow-hidden rounded-md bg-white/[0.06]"
            style={{ gridColumn: `span ${c}`, gridRow: `span ${r}` }}
          >
            {src ? (
              <Image src={src} alt="" fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
            ) : (
              <Placeholder index={index} />
            )}
          </div>
        );
      })}
    </div>
  );
}
