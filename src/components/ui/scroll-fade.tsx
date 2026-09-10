"use client";

import { useEffect, useRef } from "react";

/**
 * Плавно растворяет содержимое при прокрутке — используется для текста первого экрана,
 * который остаётся на месте, пока следующий блок поднимается поверх него.
 */
export default function ScrollFade({
  children,
  className,
  /** доля высоты экрана, за которую содержимое полностью исчезает */
  distance = 0.6,
  shift = 60,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  shift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const apply = () => {
      frame = 0;
      const limit = Math.max(1, window.innerHeight * distance);
      const p = Math.min(1, Math.max(0, window.scrollY / limit));
      el.style.opacity = String(1 - p);
      el.style.transform = `translate3d(0, ${-p * shift}px, 0)`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [distance, shift]);

  return (
    <div ref={ref} className={className} style={{ willChange: "opacity, transform" }}>
      {children}
    </div>
  );
}
