"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useHeroRotation } from "@/components/ui/hero-rotation";

/** Фон первого экрана: фотографии плавно сменяют друг друга и уходят в светлый градиент. */
export default function HeroBackdrop({ images }: { images: string[] }) {
  const { index } = useHeroRotation();
  const list = images.filter(Boolean);

  if (list.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {list.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={cn(
            "object-cover object-[72%_50%] transition-[opacity,transform] duration-[1600ms] ease-out",
            i === index ? "scale-105 opacity-100" : "scale-100 opacity-0"
          )}
        />
      ))}

      {/* светлая вуаль: на широких экранах уводим фото вправо, на узких — осветляем сверху */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/85 to-white/70 dark:from-[#0b1523] dark:via-[#0b1523]/90 dark:to-[#0b1523]/75 lg:hidden" />
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          backgroundImage:
            "linear-gradient(100deg, #ffffff 0%, #ffffff 26%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.6) 55%, rgba(255,255,255,0.15) 72%, rgba(255,255,255,0) 86%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-[#0b1523]" />
    </div>
  );
}
