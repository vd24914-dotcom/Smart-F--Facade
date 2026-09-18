"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, FileText, X } from "lucide-react";
import Reveal, { RevealGroup } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export type Certificate = {
  title: string;
  text: string;
  /** скан или фото документа */
  image: string;
  /** сам файл, если есть — в окне появится кнопка скачивания */
  file: string;
};

const isImage = (src: string) => /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(src.trim());
const isPdf = (src: string) => /\.pdf(\?|$)/i.test(src.trim());

/** Что показывать на плитке: скан, а если его нет — сам файл, когда это картинка. */
const pictureOf = (item: Certificate) =>
  item.image?.trim() ? item.image.trim() : isImage(item.file ?? "") ? item.file.trim() : "";

/** Скан документа или, если его нет, спокойная заглушка с иконкой. */
function Scan({ src, alt, sizes, contain = false }: { src: string; alt: string; sizes: string; contain?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src.trim() || failed) {
    return (
      <div className="flex size-full items-center justify-center bg-mist text-navy/40">
        <FileText className="size-12" strokeWidth={1.2} />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={contain ? "object-contain" : "object-cover object-top"}
      onError={() => setFailed(true)}
    />
  );
}

/** Листание страниц: уходящая страница отворачивается, новая разворачивается навстречу. */
const page = {
  enter: (dir: number) => ({ rotateY: dir > 0 ? 70 : -70, opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { rotateY: 0, opacity: 1, x: 0 },
  exit: (dir: number) => ({ rotateY: dir > 0 ? -70 : 70, opacity: 0, x: dir > 0 ? -40 : 40 }),
};

/** Окно просмотра: документ крупно, подпись, стрелки и скачивание. */
function Viewer({
  items,
  index,
  downloadLabel,
  onIndex,
  onClose,
}: {
  items: Certificate[];
  index: number;
  downloadLabel: string;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const [dir, setDir] = useState(0);
  const touchStartX = useRef(0);
  const total = items.length;
  const item = items[index];

  const go = useCallback(
    (delta: number) => {
      if (total <= 1) return;
      setDir(delta);
      onIndex((index + delta + total) % total);
    },
    [index, total, onIndex]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 45) go(diff < 0 ? 1 : -1);
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="modal-backdrop absolute inset-0 cursor-default bg-ink/80 backdrop-blur-sm"
      />

      <div className="modal-card relative flex max-h-[94vh] w-full max-w-[920px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_90px_-40px_rgba(8,19,36,0.75)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-30 flex size-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        {/* страница документа */}
        <div className="relative h-[56vh] min-h-[320px] bg-mist sm:h-[62vh]" style={{ perspective: "1600px" }}>
          <AnimatePresence custom={dir} mode="wait" initial={false}>
            <motion.div
              key={index}
              custom={dir}
              variants={page}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-4 overflow-hidden rounded-xl bg-white shadow-[0_20px_50px_-30px_rgba(8,19,36,0.6)] sm:inset-6"
              style={{ transformOrigin: dir >= 0 ? "left center" : "right center" }}
            >
              {!pictureOf(item) && isPdf(item.file) ? (
                // PDF без скана — показываем сам документ, браузер умеет его листать
                <iframe src={`${item.file}#toolbar=0&navpanes=0`} title={item.title} className="size-full" />
              ) : (
                <Scan src={pictureOf(item)} alt={item.title} sizes="(max-width: 920px) 100vw, 920px" contain />
              )}
            </motion.div>
          </AnimatePresence>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous"
                className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-[0_8px_24px_rgba(8,19,36,0.18)] transition hover:bg-navy hover:text-white"
              >
                <ChevronLeft className="size-5" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next"
                className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-[0_8px_24px_rgba(8,19,36,0.18)] transition hover:bg-navy hover:text-white"
              >
                <ChevronRight className="size-5" strokeWidth={2.2} />
              </button>
            </>
          )}
        </div>

        {/* подпись */}
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-7 sm:py-5">
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-extrabold uppercase leading-[1.3] text-navy sm:text-[18px]">{item.title}</p>
            {item.text?.trim() && (
              <p className="mt-1 text-[13px] font-light leading-[20px] text-graphite sm:text-[14px]">{item.text}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {total > 1 && (
              <span className="text-[12px] font-semibold tracking-[1px] text-slate-400">
                {index + 1} / {total}
              </span>
            )}
            {item.file?.trim() && (
              <a
                href={item.file}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-white px-4 py-2 text-[13px] font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-white"
              >
                <Download className="size-4" strokeWidth={1.8} />
                {downloadLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Плитки сертификатов и документов под карточками блока «Документы и сертификаты».
 * По клику документ открывается в окне; если бумаг несколько — листаются,
 * как страницы: стрелками, клавишами ←/→ или свайпом.
 */
export default function CertificateGallery({
  title,
  items,
  downloadLabel,
  className,
}: {
  title: string;
  items: Certificate[];
  downloadLabel: string;
  className?: string;
}) {
  const ready = items.filter((item) => item.title?.trim() && (item.image?.trim() || item.file?.trim()));
  const [opened, setOpened] = useState<number | null>(null);
  const close = useCallback(() => setOpened(null), []);

  if (ready.length === 0) return null;

  return (
    <div className={cn("mt-14", className)}>
      {title?.trim() && (
        <Reveal>
          <h3 className="text-[15px] font-bold uppercase tracking-[1.5px] text-navy">{title}</h3>
        </Reveal>
      )}

      <RevealGroup className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" step={70}>
        {ready.map((item, index) => (
          <button
            key={item.title + index}
            type="button"
            onClick={() => setOpened(index)}
            className="group relative overflow-hidden rounded-2xl border border-navy/10 bg-white text-left shadow-[0_25px_60px_-45px_rgba(8,19,36,0.55)] transition duration-300 hover:-translate-y-1 hover:border-navy/30"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-mist">
              <Scan src={pictureOf(item)} alt={item.title} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,19,36,0)_45%,rgba(8,19,36,0.85)_100%)]"
              />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="line-clamp-2 text-[13px] font-bold uppercase leading-[18px] text-white sm:text-[14px]">
                  {item.title}
                </p>
              </div>
            </div>
          </button>
        ))}
      </RevealGroup>

      {opened !== null && ready[opened] && (
        <Viewer items={ready} index={opened} downloadLabel={downloadLabel} onIndex={setOpened} onClose={close} />
      )}
    </div>
  );
}
