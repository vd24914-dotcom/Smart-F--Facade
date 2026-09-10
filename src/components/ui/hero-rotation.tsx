"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Rotation = {
  index: number;
  count: number;
  go: (index: number) => void;
  /** элемент-заполнитель полоски прогресса; провайдер сам двигает его каждый кадр */
  fillRef: React.MutableRefObject<HTMLElement | null>;
};

const HeroRotationContext = createContext<Rotation | null>(null);

export function useHeroRotation() {
  const ctx = useContext(HeroRotationContext);
  if (!ctx) throw new Error("useHeroRotation must be used inside <HeroRotation>");
  return ctx;
}

/** Общий таймер первого экрана: и фон, и полоска прогресса живут по одному отсчёту. */
export default function HeroRotation({
  count,
  interval = 5000,
  children,
}: {
  count: number;
  interval?: number;
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const fillRef = useRef<HTMLElement | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    startRef.current = performance.now();

    const tick = (now: number) => {
      // во время скрытой вкладки таймер стоит
      if (document.hidden) startRef.current = now;

      const ratio = Math.min(1, (now - startRef.current) / interval);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${ratio})`;

      if (ratio >= 1) {
        startRef.current = now;
        setIndex((i) => (i + 1) % count);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [count, interval]);

  const go = useCallback((next: number) => {
    startRef.current = performance.now();
    if (fillRef.current) fillRef.current.style.transform = "scaleX(0)";
    setIndex(next);
  }, []);

  return (
    <HeroRotationContext.Provider value={{ index, count, go, fillRef }}>
      {children}
    </HeroRotationContext.Provider>
  );
}
