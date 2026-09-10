"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "sf-theme";

type WithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

/** Переключатель светлой и тёмной темы: тема расходится кругом от кнопки. */
export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);

  const toggle = async () => {
    const next = !dark;
    const root = document.documentElement;

    const apply = () => {
      root.classList.toggle("dark", next);
      setDark(next);
      try {
        localStorage.setItem(KEY, next ? "dark" : "light");
      } catch {
        // приватный режим — просто не запоминаем
      }
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as WithViewTransition;

    // без поддержки — мягкое перекрашивание цветов
    if (reduce || typeof doc.startViewTransition !== "function") {
      root.classList.add("theme-switching");
      apply();
      window.setTimeout(() => root.classList.remove("theme-switching"), 600);
      return;
    }

    // круг расходится от кнопки до дальнего угла экрана
    const rect = btnRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 60;
    const y = rect ? rect.top + rect.height / 2 : 40;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(apply);

    try {
      await transition.ready;
      root.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: 620,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    } catch {
      // если анимация не поддерживается — тема всё равно уже применилась
    }
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-navy transition hover:bg-navy/10",
        className
      )}
    >
      <Sun
        className={cn(
          "absolute size-4 transition-all duration-500",
          ready && dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
        )}
      />
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-500",
          ready && dark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
    </button>
  );
}
