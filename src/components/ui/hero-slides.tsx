"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Фон первого экрана: кадры сменяют друг друга плавным перетеканием.
 *
 * Один кадр — обычная картинка, без таймера и без лишнего кода в браузере.
 * Несколько — крутим по кругу, но останавливаемся, когда вкладку свернули:
 * иначе при возвращении посетитель поймает пачку миганий разом.
 */
export default function HeroSlides({
  slides,
  seconds,
  className = "",
}: {
  slides: string[];
  seconds: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;

    // тем, кто просил в системе меньше движения, оставляем один кадр
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (calm?.matches) return;

    const pause = Math.max(3, seconds) * 1000;
    let timer = window.setInterval(next, pause);

    function next() {
      setShown((index) => (index + 1) % slides.length);
    }

    function onVisibility() {
      window.clearInterval(timer);
      if (!document.hidden) timer = window.setInterval(next, pause);
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slides.length, seconds]);

  if (slides.length === 0) return null;

  return (
    <>
      {slides.map((src, index) => (
        <Image
          key={src + index}
          src={src}
          alt=""
          fill
          // первый кадр грузим сразу — он попадает в первый экран
          priority={index === 0}
          sizes="100vw"
          className={`${className} transition-opacity duration-1000 ease-in-out ${
            index === shown ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}
