"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Кнопка со свечением, которое идёт от курсора: при наведении под пальцем
 * загорается светлое пятно и едет вместе с мышью.
 */
export default function GlowButton({
  children,
  onClick,
  className,
  glowClassName,
  radius = 60,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /** цвет пятна, задаётся через `bg-...` или произвольный градиент */
  glowClassName?: string;
  /** размер пятна в пикселях */
  radius?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);

  /** координаты курсора пишем в CSS-переменные — так не дёргаем React на каждый пиксель */
  const track = (event: React.PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerMove={track}
      onPointerEnter={(event) => {
        track(event);
        setHover(true);
      }}
      onPointerLeave={() => setHover(false)}
      className={cn("glow-btn", className)}
      style={{ ["--glow-radius" as string]: `${radius}px` }}
    >
      <span
        aria-hidden
        className={cn("glow-btn__light", hover && "is-on", glowClassName)}
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
