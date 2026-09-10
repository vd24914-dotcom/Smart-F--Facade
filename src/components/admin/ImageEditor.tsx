"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Preset = { label: string; value: number };

const presets: Preset[] = [
  { label: "16:9 — широкое", value: 16 / 9 },
  { label: "21:9 — панорама", value: 21 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1 — квадрат", value: 1 },
  { label: "4:5 — вертикальное", value: 4 / 5 },
  { label: "3:4 — вертикальное", value: 3 / 4 },
];

const FRAME_W = 520;
const MAX_OUT = 2200;

/**
 * Редактор картинки: рамка нужной пропорции, фото двигается мышкой и масштабируется.
 * Сохраняет ровно то, что видно в рамке.
 */
export default function ImageEditor({
  src,
  fileName,
  aspect: initialAspect = 16 / 9,
  onCancel,
  onDone,
}: {
  src: string;
  fileName: string;
  aspect?: number;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const [aspect, setAspect] = useState(initialAspect);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const frameH = Math.round(FRAME_W / aspect);

  // базовый масштаб «cover» — картинка всегда закрывает рамку
  const base = size ? Math.max(FRAME_W / size.w, frameH / size.h) : 1;
  const scale = base * zoom;

  const clamp = useCallback(
    (next: { x: number; y: number }) => {
      if (!size) return next;
      const limitX = Math.max(0, (size.w * scale - FRAME_W) / 2);
      const limitY = Math.max(0, (size.h * scale - frameH) / 2);
      return {
        x: Math.min(limitX, Math.max(-limitX, next.x)),
        y: Math.min(limitY, Math.max(-limitY, next.y)),
      };
    },
    [size, scale, frameH]
  );

  useEffect(() => {
    setOffset((prev) => clamp(prev));
  }, [clamp]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(clamp({ x: drag.ox + (e.clientX - drag.x), y: drag.oy + (e.clientY - drag.y) }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  async function save() {
    const img = imgRef.current;
    if (!img || !size) return;
    setBusy(true);
    setError("");

    try {
      // какой кусок исходника попал в рамку
      const srcW = FRAME_W / scale;
      const srcH = frameH / scale;
      const cx = size.w / 2 - offset.x / scale;
      const cy = size.h / 2 - offset.y / scale;

      const outW = Math.min(MAX_OUT, Math.round(srcW));
      const outH = Math.round(outW / aspect);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Браузер не поддерживает обработку изображений");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, cx - srcW / 2, cy - srcH / 2, srcW, srcH, 0, 0, outW, outH);

      const png = /\.png$/i.test(fileName);
      const type = png ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, png ? undefined : 0.92)
      );
      if (!blob) throw new Error("Не удалось подготовить файл");

      const name = fileName.replace(/\.[^.]+$/, "") + (png ? ".png" : ".jpg");
      onDone(new File([blob], name, { type }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка обработки");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 p-4">
      <div className="max-h-[94vh] w-full max-w-[620px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-slate-900">Кадрирование</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-2 py-1 text-[18px] leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">
          Тяните картинку мышкой, колесо или ползунок — масштаб. Сохранится то, что внутри рамки.
        </p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none select-none overflow-hidden rounded-xl bg-slate-100 active:cursor-grabbing"
          style={{ width: FRAME_W, height: frameH, maxWidth: "100%" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY / 800)))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setSize({ w: el.naturalWidth, h: el.naturalHeight });
              setOffset({ x: 0, y: 0 });
              setZoom(1);
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center"
            style={{
              width: size ? size.w * scale : "auto",
              height: size ? size.h * scale : "auto",
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-white/80" />
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="border border-white/25" />
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-slate-700">Масштаб</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-slate-700">Пропорции</span>
            <select
              value={String(aspect)}
              onChange={(e) => setAspect(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none focus:border-slate-900"
            >
              {presets.some((p) => Math.abs(p.value - initialAspect) < 0.001) ? null : (
                <option value={String(initialAspect)}>Как в блоке (рекомендуется)</option>
              )}
              {presets.map((p) => (
                <option key={p.label} value={String(p.value)}>
                  {p.label}
                  {Math.abs(p.value - initialAspect) < 0.001 ? " — рекомендуется" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy || !size}
            onClick={save}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? "Сохраняю…" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-slate-900"
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-[14px] font-semibold text-slate-500 transition hover:text-slate-900"
          >
            Отмена
          </button>
          {size && (
            <span className="ml-auto text-[12px] text-slate-400">
              оригинал {size.w}×{size.h}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
