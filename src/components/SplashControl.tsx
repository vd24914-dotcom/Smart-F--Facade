"use client";

import { useEffect } from "react";

/** Сколько живёт заставка: должно совпадать с CSS. */
const LIFETIME = 2800;

/** При «уменьшить движение» показываем только логотип и быстро уходим. */
const LIFETIME_CALM = 1700;

/** Заставка показывается один раз за посещение, а не при каждом переходе. */
let alreadyPlayed = false;

/**
 * Мелочи, которые нельзя сделать на CSS: не даём странице прокручиваться,
 * пока идёт заставка, и прячем её, когда она отыграла.
 * Клик или прокрутка пропускают заставку.
 *
 * Важно: сам блок заставки мы не трогаем — им распоряжается React.
 * Раньше здесь был splash.remove(), и React потом спотыкался об исчезнувший
 * узел: при переходе между страницами весь экран падал в ошибку.
 * Поэтому всё управление — через классы на <html>, их React не трогает.
 */
export default function SplashControl() {
  useEffect(() => {
    const root = document.documentElement;

    // второй раз за посещение не показываем
    if (alreadyPlayed) {
      root.classList.remove("splash-open", "splash-skip");
      root.classList.add("splash-done");
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    alreadyPlayed = true;
    root.classList.remove("splash-done", "splash-skip");
    root.classList.add("splash-open");

    const finish = () => {
      root.classList.remove("splash-open");
      root.classList.add("splash-done");
      cleanup();
    };

    const skip = () => {
      root.classList.add("splash-skip");
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
