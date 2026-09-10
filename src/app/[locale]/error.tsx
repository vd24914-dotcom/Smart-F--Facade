"use client";

import ErrorScreen from "@/components/ErrorScreen";

/**
 * Ловит сбои внутри страниц сайта. Самая частая причина — открытая вкладка,
 * пока сайт выложили заново: браузер просит куски старой сборки, а их уже нет.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorScreen reset={reset} />;
}
