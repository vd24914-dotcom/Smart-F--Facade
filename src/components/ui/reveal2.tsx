"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Photo = { src: string; alt?: string };

type Props = {
  before: Photo;
  after: Photo;
  beforeLabel?: string;
  afterLabel?: string;
  /** стартовое положение шторки, % */
  initialPosition?: number;
  className?: string;
};

/** Шторка сравнения: слева фото «до», справа «после». Тянется мышкой, пальцем и стрелками. */
export default function Reveal2({
  before,
  after,
  beforeLabel = "До",
  afterLabel = "После",
  initialPosition = 50,
  className,
}: Props) {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const move = useCallback((clientX: number) => {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const value = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, value)));
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => move(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) move(touch.clientX);
    };
    const onEnd = () => setDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchend", onEnd);
    };
  }, [dragging, move]);

  if (!before?.src || !after?.src) return null;

  return (
    <div
      ref={boxRef}
      role="slider"
      aria-label={`${beforeLabel} / ${afterLabel}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      tabIndex={0}
      onMouseDown={(e) => {
        e.preventDefault();
        setDragging(true);
        move(e.clientX);
      }}
      onTouchStart={(e) => {
        setDragging(true);
        const touch = e.touches[0];
        if (touch) move(touch.clientX);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 4));
        if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 4));
      }}
      className={cn(
        "relative aspect-[16/10] w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border border-navy/10 bg-mist shadow-[0_30px_70px_-45px_rgba(8,19,36,0.6)] outline-none focus-visible:ring-2 focus-visible:ring-navy/40",
        className
      )}
    >
      {/* «после» — нижний слой */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after.src}
        alt={after.alt || afterLabel}
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />

      {/* «до» — обрезается по положению шторки */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before.src}
          alt={before.alt || beforeLabel}
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
      </div>

      {/* разделитель */}
      <div
        className="absolute bottom-0 top-0 z-10 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_20px_rgba(8,19,36,0.35)]"
        style={{ left: `${position}%` }}
      >
        <span
          className={cn(
            "absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-navy bg-white shadow-lg transition-transform",
            dragging && "scale-110"
          )}
        >
          <GripVertical className="size-5 text-navy" />
        </span>
      </div>

      <span className="absolute left-4 top-4 z-20 rounded-full bg-ink/70 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="absolute right-4 top-4 z-20 rounded-full bg-ink/70 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm">
        {afterLabel}
      </span>
    </div>
  );
}
