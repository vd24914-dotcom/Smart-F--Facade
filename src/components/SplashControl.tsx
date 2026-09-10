"use client";

import { useEffect } from "react";

/** Сколько живёт заставка: должно совпадать с CSS. */
const LIFETIME = 2800;

/** При «уменьшить движение» показываем только логотип и быстро уходим. */
const LIFETIME_CALM = 1700;

/**
 * Мелочи, которые нельзя сделать на CSS: не даём странице прокручиваться,
 * пока идёт заставка, и убираем её из разметки, когда она отыграла.
 * Клик или прокрутка пропускают заставку.
 */
export default function SplashControl() {
  useEffect(() => {
    const root = document.documentElement;
    const splash = document.querySelector(".splash");
    if (!splash) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.classList.add("splash-open");

    const finish = () => {
      root.classList.remove("splash-open");
      splash.remove();
      cleanup();
    };

    const skip = () => {
      splash.classList.add("is-skipped");
      window.setTimeout(finish, 320);
    };

    const timer = window.setTimeout(finish, reduce ? LIFETIME_CALM : LIFETIME);

    // пропустить, если человек не хочет ждать
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
    }

    return cleanup;
  }, []);

  return null;
}
