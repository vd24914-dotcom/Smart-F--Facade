"use client";

import ErrorScreen from "@/components/ErrorScreen";
import "./globals.css";

/**
 * Последний рубеж: сбой в самой обёртке сайта. Здесь Next.js не рисует
 * ни <html>, ни <body> — их нужно вернуть самим.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ru">
      <body>
        <ErrorScreen reset={reset} />
      </body>
    </html>
  );
}
