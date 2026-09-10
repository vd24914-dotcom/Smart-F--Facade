"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Считает просмотры страниц. Ничего личного не собирает — только счётчик по дням. */
export default function StatsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    let first = false;
    try {
      first = !sessionStorage.getItem("sf_visit");
      if (first) sessionStorage.setItem("sf_visit", "1");
    } catch {
      // приватный режим — считаем как обычный просмотр
    }

    const id = window.setTimeout(() => {
      fetch("/api/stat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first }),
        keepalive: true,
      }).catch(() => {});
    }, 400);

    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
