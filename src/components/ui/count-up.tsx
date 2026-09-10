"use client";

import { useEffect, useRef, useState } from "react";

/** Разбираем «200 000», «200,000», «10+» — цифры анимируем, остальное оставляем как есть. */
function parse(value: string) {
  const match = value.match(/[\d][\d\s., ]*/);
  if (!match) return null;

  const raw = match[0];
  const digits = raw.replace(/[^\d]/g, "");
  const target = Number(digits);
  if (!Number.isFinite(target) || digits.length === 0) return null;

  const separator = /[\s ]/.test(raw) ? " " : raw.includes(",") ? "," : "";

  return {
    target,
    prefix: value.slice(0, match.index ?? 0),
    suffix: value.slice((match.index ?? 0) + raw.length),
    separator,
  };
}

const group = (n: number, separator: string) =>
  separator ? n.toLocaleString("ru-RU").replace(/ /g, separator) : String(n);

/** Цифра, которая набегает от нуля, когда блок появляется на экране. */
export default function CountUp({
  value,
  duration = 1400,
  repeat = 10000,
  delay = 0,
  className,
}: {
  value: string;
  duration?: number;
  /** повторять пересчёт каждые N мс, пока блок на экране; 0 — без повтора */
  repeat?: number;
  delay?: number;
  className?: string;
}) {
  const parsed = parse(value);
  const [text, setText] = useState(parsed ? `${parsed.prefix}0${parsed.suffix}` : value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(value);
      return;
    }

    let frame = 0;
    let start = 0;
    let visible = false;
    let startTimer = 0;
    let loop = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(parsed.target * eased);

      setText(`${parsed.prefix}${group(current, parsed.separator)}${parsed.suffix}`);
      if (p < 1) frame = requestAnimationFrame(step);
    };

    const run = () => {
      cancelAnimationFrame(frame);
      start = 0;
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          visible = true;
          startTimer = window.setTimeout(run, delay);
        }
        visible = entry.isIntersecting;
      },
      { threshold: 0.4 }
    );

    observer.observe(el);

    if (repeat > 0) {
      loop = window.setInterval(() => {
        if (visible && !document.hidden) run();
      }, repeat);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(startTimer);
      window.clearInterval(loop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, repeat, delay]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
