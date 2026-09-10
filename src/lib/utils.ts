/**
 * Склейка классов Tailwind без лишних зависимостей.
 * Если позже подключите shadcn/ui — замените на вариант с clsx + tailwind-merge.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
