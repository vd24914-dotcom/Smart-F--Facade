"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tile = { id: number; src: string };

/** Перемешивание Фишера — Йетса, возвращает новый массив. */
function shuffle<T>(list: T[]) {
  const next = list.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

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

  /** роль плитки по её месту в порядке: сколько колонок и рядов она занимает */
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
function Placeholder({ id }: { id: number }) {
  const shade = ["bg-white/[0.05]", "bg-white/[0.08]", "bg-white/[0.11]"][id % 3];
  return (
    <div className={cn("flex size-full items-center justify-center border border-white/10 text-gold/60", shade)}>
      <LayersIcon className="size-6 sm:size-7" />
    </div>
  );
}

/**
 * Сетка фотографий. Порядок один раз перемешивается, когда сетка доезжает
 * до экрана, — плитки плавно разъезжаются по новым местам. Число фотографий
 * любое; без фотографий показываем четыре заглушки.
 */
export default function ShuffleGrid({
  photos,
  className,
}: {
  photos: string[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef(0);

  const list = photos.map((src) => src.trim()).filter(Boolean);
  const count = list.length || 4;

  // порядок на сервере и при первой отрисовке одинаковый — иначе React ругается на разметку
  const [tiles, setTiles] = useState<Tile[]>(() =>
    Array.from({ length: count }, (_, i) => ({ id: i, src: list[i] ?? "" }))
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // два перемешивания подряд: первое сразу, второе через паузу — так движение читается лучше
        setTiles((prev) => shuffle(prev));
        timer.current = window.setTimeout(() => setTiles((prev) => shuffle(prev)), 1800);
      },
      { threshold: 0.35 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer.current);
    };
  }, []);

  const { cols, rows, span } = layout(tiles.length);

  return (
    <div
      ref={ref}
      className={cn("grid w-full gap-1.5", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gridAutoFlow: "dense",
        aspectRatio: `${cols} / ${rows}`,
      }}
    >
      {tiles.map((tile, index) => {
        const [c, r] = span(index);
        return (
          <motion.div
            key={tile.id}
            layout
            transition={{ duration: 1.5, type: "spring" }}
            className="relative overflow-hidden rounded-md bg-white/[0.06]"
            style={{ gridColumn: `span ${c}`, gridRow: `span ${r}` }}
          >
            {tile.src ? (
              <Image
                src={tile.src}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 240px"
                className="object-cover"
              />
            ) : (
              <Placeholder id={tile.id} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
