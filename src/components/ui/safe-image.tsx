"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * Картинка, которая не ломает вёрстку.
 *
 * Если файла нет (удалили, переименовали, не догрузился) — вместо «битой»
 * иконки браузера показывается спокойная заглушка, а для фонов — просто ничего.
 */
export default function SafeImage({
  onMissing = "placeholder",
  className,
  alt = "",
  ...props
}: ImageProps & { onMissing?: "placeholder" | "hide" }) {
  const [failed, setFailed] = useState(false);
  const src = typeof props.src === "string" ? props.src.trim() : props.src;

  const missing = failed || !src;

  if (missing && onMissing === "hide") return null;

  if (missing) {
    return (
      <span
        aria-hidden
        className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className ?? ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-1/3 w-1/3 max-h-8 max-w-8">
          <path
            d="M3 16.5 8 11l4 4 3-3 6 6M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <Image {...props} src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
