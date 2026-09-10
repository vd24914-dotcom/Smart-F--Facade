"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Parsed = { viewBox: string; outline: string; fill: string };

const cache = new Map<string, Parsed>();

/** Готовим два слоя: контур для «черчения» и оригинальную заливку. */
function parse(text: string): Parsed | null {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg || doc.querySelector("parsererror")) return null;

  const viewBox =
    svg.getAttribute("viewBox") ||
    `0 0 ${svg.getAttribute("width") || 100} ${svg.getAttribute("height") || 100}`;

  // заливку приводим к одному цвету — берётся из currentColor
  const fillSvg = svg.cloneNode(true) as SVGSVGElement;
  fillSvg.querySelectorAll("path, rect, circle, ellipse, line, polyline, polygon").forEach((node) => {
    const value = node.getAttribute("fill");
    if (value && value !== "none") node.setAttribute("fill", "currentColor");
    if (node.getAttribute("stroke")) node.setAttribute("stroke", "currentColor");
  });
  const fill = fillSvg.innerHTML;

  // копия, где всё превращается в тонкие линии
  const outlineSvg = svg.cloneNode(true) as SVGSVGElement;
  outlineSvg.querySelectorAll("path, rect, circle, ellipse, line, polyline, polygon").forEach((node) => {
    node.setAttribute("fill", "none");
    node.setAttribute("stroke", "currentColor");
    node.setAttribute("stroke-width", "1.4");
    node.setAttribute("stroke-linecap", "round");
    node.setAttribute("stroke-linejoin", "round");
    node.setAttribute("vector-effect", "non-scaling-stroke");
    node.setAttribute("pathLength", "1");
  });

  return { viewBox, outline: outlineSvg.innerHTML, fill };
}

/**
 * Иконка «как будто чертят»: сначала линия обводит контур, затем проявляется сама иконка.
 * Работает с обычными SVG из public/ — файлы не меняются.
 */
export default function DrawIcon({
  src,
  className,
  delay = 0,
}: {
  src: string;
  className?: string;
  delay?: number;
}) {
  const [data, setData] = useState<Parsed | null>(() => cache.get(src) ?? null);
  const [drawing, setDrawing] = useState(false);
  const [run, setRun] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  // загружаем файл один раз на страницу
  useEffect(() => {
    if (cache.has(src)) {
      setData(cache.get(src)!);
      return;
    }
    let alive = true;
    fetch(src)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("no svg"))))
      .then((text) => {
        const parsed = parse(text);
        if (!parsed || !alive) return;
        cache.set(src, parsed);
        setData(parsed);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src]);

  // запускаем, когда иконка на экране, и повторяем каждые 10 секунд
  useEffect(() => {
    const el = ref.current;
    if (!el || !data) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawing(true);
      return;
    }

    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) setDrawing(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);

    const timer = window.setInterval(() => {
      if (visible && !document.hidden) setRun((r) => r + 1);
    }, 10000);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [data]);

  // пока файл не загрузился — место под иконку, чтобы не прыгала вёрстка
  if (!data) return <span ref={ref} className={cn("block", className)} aria-hidden />;

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn("draw-icon block", drawing && "is-drawing", className)}
      style={{ ["--draw-delay" as string]: `${delay}ms` }}
    >
      <svg key={run} viewBox={data.viewBox} className="h-full w-full" fill="none">
        <g className="draw-icon__line" dangerouslySetInnerHTML={{ __html: data.outline }} />
        <g className="draw-icon__fill" dangerouslySetInnerHTML={{ __html: data.fill }} />
      </svg>
    </span>
  );
}
