"use client";

import { cn } from "@/lib/utils";
import { useHeroRotation } from "@/components/ui/hero-rotation";

/** Ползунок рядом с карточкой цифр: показывает, сколько осталось до смены фото. */
export default function HeroProgress() {
  const { index, count, go, fillRef } = useHeroRotation();

  if (count < 2) return null;

  return (
    <div className="flex shrink-0 flex-row items-center gap-4 rounded-2xl border border-navy/20 bg-white/85 px-5 py-4 shadow-[0_25px_60px_-30px_rgba(41,79,123,0.55)] backdrop-blur sm:w-[150px] sm:flex-col sm:items-stretch sm:justify-center sm:gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[2px] text-navy/50">
        {String(index + 1).padStart(2, "0")}
        <span className="text-navy/30"> / {String(count).padStart(2, "0")}</span>
      </span>

      <span className="relative block h-1 w-full min-w-[70px] overflow-hidden rounded-full bg-navy/10">
        <span
          ref={(el) => {
            fillRef.current = el;
          }}
          className="absolute inset-0 origin-left rounded-full bg-navy"
          style={{ transform: "scaleX(0)" }}
        />
      </span>

      <span className="flex gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`${i + 1}`}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i === index ? "bg-navy" : "bg-navy/15 hover:bg-navy/35"
            )}
          />
        ))}
      </span>
    </div>
  );
}
