"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Сколько плиток в сетке: 4 × 4 */
const CELLS = 16;

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
  // чуть разная плотность, чтобы шестнадцать одинаковых плиток не сливались в одно пятно
  const shade = ["bg-white/[0.05]", "bg-white/[0.08]", "bg-white/[0.11]"][id % 3];
  return (
    <div className={cn("flex size-full items-center justify-center border border-white/10 text-gold/60", shade)}>
      <LayersIcon className="size-5 sm:size-6" />
    </div>
  );
}

/**
 * Сетка 4 × 4 из фотографий. Порядок один раз перемешивается, когда сетка
 * доезжает до экрана, — плитки плавно разъезжаются по новым местам.
 * Если фотографий меньше шестнадцати, недостающие места занимают заглушки.
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

  // порядок на сервере и при первой отрисовке одинаковый — иначе React ругается на разметку
  const [tiles, setTiles] = useState<Tile[]>(() =>
    Array.from({ length: CELLS }, (_, i) => ({ id: i, src: (photos[i] ?? "").trim() }))
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

  return (
    <div ref={ref} className={cn("grid aspect-square w-full grid-cols-4 grid-rows-4 gap-1.5", className)}>
      {tiles.map((tile) => (
        <motion.div
          key={tile.id}
          layout
          transition={{ duration: 1.5, type: "spring" }}
          className="relative size-full overflow-hidden rounded-md bg-white/[0.06]"
        >
          {tile.src ? (
            <Image
              src={tile.src}
              alt=""
              fill
              sizes="(max-width: 640px) 25vw, 120px"
              className="object-cover"
            />
          ) : (
            <Placeholder id={tile.id} />
          )}
        </motion.div>
      ))}
    </div>
  );
}
