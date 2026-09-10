"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Lang = "ru" | "uz" | "en";

const copy: Record<Lang, { title: string; text: string; retry: string; home: string }> = {
  ru: {
    title: "Страница не открылась",
    text: "Похоже, сайт только что обновился. Обычно помогает обновить страницу.",
    retry: "Обновить страницу",
    home: "На главную",
  },
  uz: {
    title: "Sahifa ochilmadi",
    text: "Sayt hozirgina yangilangan ko‘rinadi. Odatda sahifani yangilash yordam beradi.",
    retry: "Sahifani yangilash",
    home: "Bosh sahifaga",
  },
  en: {
    title: "The page didn’t load",
    text: "The site was just updated. Reloading the page usually fixes this.",
    retry: "Reload the page",
    home: "Go to home page",
  },
};

/** Ключ, чтобы автоматическая перезагрузка случилась один раз, а не по кругу. */
const ONCE = "sf-reloaded-after-error";

export default function ErrorScreen({ reset }: { reset?: () => void }) {
  const pathname = usePathname();
  const lang: Lang = pathname?.startsWith("/uz") ? "uz" : pathname?.startsWith("/en") ? "en" : "ru";
  const t = copy[lang];

  // Чаще всего это старая вкладка после выкладки новой версии — одна перезагрузка лечит.
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    let reloading = false;
    try {
      if (!sessionStorage.getItem(ONCE)) {
        sessionStorage.setItem(ONCE, "1");
        reloading = true;
        window.location.reload();
      }
    } catch {
      // приватный режим — просто покажем кнопку
    }
    if (!reloading) setWaiting(false);
  }, []);

  const reload = () => {
    try {
      sessionStorage.removeItem(ONCE);
    } catch {}
    window.location.reload();
  };

  if (waiting) return <div style={{ minHeight: "100vh", background: "#fff" }} />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-16 text-center">
      <div className="max-w-[420px]">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-[#f0f5fa]">
          <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
            <path
              d="M12 8v5m0 3.5h.01M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              stroke="#294f7b"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-[22px] font-extrabold text-[#081324]">{t.title}</h1>
        <p className="mt-2 text-[15px] leading-[24px] text-[#333]">{t.text}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset ?? reload}
            className="rounded-full bg-[#294f7b] px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {t.retry}
          </button>
          <a
            href={`/${lang}`}
            className="rounded-full border border-[#294f7b]/25 px-6 py-3 text-[14px] font-semibold text-[#294f7b] transition-colors hover:border-[#294f7b]"
          >
            {t.home}
          </a>
        </div>
      </div>
    </div>
  );
}
