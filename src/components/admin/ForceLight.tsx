"use client";

import { useEffect } from "react";

/** Админка всегда в светлой теме, даже если на сайте включена тёмная. */
export default function ForceLight() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  return null;
}
